"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Clock, BarChart3, Users, Calendar, History, Save, Upload, Download, X, Trash2 } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  LabelList,
} from "recharts"

interface Employee {
  id: number
  name: string
  hours: string
  dailyGoal: string
}

interface DailyRecord {
  date: string
  employees: Array<{
    name: string
    hours: string
    dailyGoal: string
    percentage: number
  }>
  averagePercentage: number
  averageTime: string
}

export default function HoursPercentageCalculator() {
  const [workTime, setWorkTime] = useState("8:30")
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, name: "Raposo", hours: "", dailyGoal: "8:30" },
    { id: 2, name: "Mika", hours: "", dailyGoal: "8:30" },
    { id: 3, name: "Luiz", hours: "", dailyGoal: "8:30" },
    { id: 4, name: "Schutz", hours: "", dailyGoal: "6:00" },
    { id: 5, name: "Caio", hours: "", dailyGoal: "6:00" },
    { id: 6, name: "Thiago", hours: "", dailyGoal: "6:00" },
  ])
  const [history, setHistory] = useState<DailyRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0])
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = () => {
    try {
      const result = localStorage.getItem("work-hours-history")
      if (result) {
        setHistory(JSON.parse(result))
      }
    } catch (error) {
      console.log("Nenhum histórico encontrado")
    }
  }

  const saveToHistory = () => {
    const dailyRecord: DailyRecord = {
      date: currentDate,
      employees: employees.map((emp) => ({
        name: emp.name,
        hours: emp.hours,
        dailyGoal: emp.dailyGoal,
        percentage: emp.hours ? getNumericPercentage(emp.hours, emp.dailyGoal) : 0,
      })),
      averagePercentage: Number.parseFloat(calculateAveragePercentage().replace(",", ".")),
      averageTime: calculateAverageTime(),
    }

    const newHistory = [...history.filter((h) => h.date !== currentDate), dailyRecord].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    setHistory(newHistory)

    try {
      localStorage.setItem("work-hours-history", JSON.stringify(newHistory))
      alert(`Dia ${formatDate(currentDate)} salvo com sucesso! ✓`)
    } catch (error) {
      alert("Erro ao salvar: " + (error instanceof Error ? error.message : "Desconhecido"))
    }
  }

  const deleteDay = (date: string) => {
    if (window.confirm(`Tem certeza que deseja deletar o dia ${formatDate(date)}?`)) {
      const newHistory = history.filter((h) => h.date !== date)
      setHistory(newHistory)
      localStorage.setItem("work-hours-history", JSON.stringify(newHistory))
      alert("Dia deletado com sucesso!")
    }
  }

  const timeToMinutes = (time: string): number => {
    if (!time || !time.includes(":")) return 0
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  const calculatePercentage = (workedTime: string, goalTime: string): string => {
    const goalMinutes = timeToMinutes(goalTime)
    const workedMinutes = timeToMinutes(workedTime)
    if (goalMinutes === 0) return "0,0"
    return ((workedMinutes / goalMinutes) * 100).toFixed(1).replace(".", ",")
  }

  const getNumericPercentage = (workedTime: string, goalTime: string): number => {
    const goalMinutes = timeToMinutes(goalTime)
    const workedMinutes = timeToMinutes(workedTime)
    if (goalMinutes === 0) return 0
    return (workedMinutes / goalMinutes) * 100
  }

  const calculateAverageTime = (): string => {
    const validEmployees = employees.filter((emp) => emp.hours && emp.hours.includes(":"))
    if (validEmployees.length === 0) return "0:00"

    const totalMinutes = validEmployees.reduce((sum, emp) => sum + timeToMinutes(emp.hours), 0)
    const avgMinutes = Math.round(totalMinutes / validEmployees.length)
    const hours = Math.floor(avgMinutes / 60)
    const minutes = avgMinutes % 60
    return `${hours}:${minutes.toString().padStart(2, "0")}`
  }

  const calculateAveragePercentage = (): string => {
    const validEmployees = employees.filter((emp) => emp.hours && emp.hours.includes(":"))
    if (validEmployees.length === 0) return "0,0"

    const totalPercentage = validEmployees.reduce((sum, emp) => sum + getNumericPercentage(emp.hours, emp.dailyGoal), 0)
    const avg = (totalPercentage / validEmployees.length).toFixed(1)
    return avg.replace(".", ",")
  }

  const getChartData = () => {
    return employees
      .filter((emp) => emp.hours && emp.hours.includes(":"))
      .map((emp) => ({
        name: emp.name || "Sem nome",
        percentage: getNumericPercentage(emp.hours, emp.dailyGoal),
        displayPercentage: calculatePercentage(emp.hours, emp.dailyGoal),
        goal: emp.dailyGoal,
        hoursWorked: emp.hours,
      }))
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border-2" style={{ borderColor: "#003a75" }}>
          <p className="font-semibold text-gray-800">{payload[0].payload.name}</p>
          <p style={{ color: "#003a75" }} className="font-bold">
            {payload[0].payload.displayPercentage}%
          </p>
          <p className="text-sm text-gray-500">Meta: {payload[0].payload.goal}</p>
          <p className="text-sm text-gray-600 font-semibold mt-1">Horas: {payload[0].payload.hoursWorked}</p>
        </div>
      )
    }
    return null
  }

  const addEmployee = () => {
    setEmployees([...employees, { id: Date.now(), name: "", hours: "", dailyGoal: "8:30" }])
  }

  const removeEmployee = (id: number) => {
    if (employees.length > 1) {
      setEmployees(employees.filter((emp) => emp.id !== id))
    }
  }

  const updateEmployee = (id: number, field: keyof Employee, value: string) => {
    setEmployees(employees.map((emp) => (emp.id === id ? { ...emp, [field]: value } : emp)))
  }

  const formatTimeInput = (value: string): string => {
    const numbers = value.replace(/\D/g, "")
    const limited = numbers.slice(0, 4)

    if (limited.length <= 2) {
      return limited
    }
    return `${limited.slice(0, 2)}:${limited.slice(2)}`
  }

  const handleTimeChange = (id: number, value: string) => {
    const formatted = formatTimeInput(value)
    updateEmployee(id, "hours", formatted)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const nextIndex = currentIndex + 1
      if (nextIndex < employees.length) {
        const nextInput = document.getElementById(`hours-input-${nextIndex}`) as HTMLInputElement
        if (nextInput) {
          nextInput.focus()
          nextInput.select()
        }
      }
    }
  }

  const getWeekData = () => {
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 6)

    return history
      .filter((h) => new Date(h.date) >= weekAgo && new Date(h.date) <= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getMonthData = () => {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    return history
      .filter((h) => new Date(h.date) >= monthStart && new Date(h.date) <= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const calculateWeeklyAverage = (): string => {
    const weekData = getWeekData()
    if (weekData.length === 0) return "0,0"
    const avg = weekData.reduce((sum, day) => sum + day.averagePercentage, 0) / weekData.length
    return avg.toFixed(1).replace(".", ",")
  }

  const calculateMonthlyAverage = (): string => {
    const monthData = getMonthData()
    if (monthData.length === 0) return "0,0"
    const avg = monthData.reduce((sum, day) => sum + (day.averagePercentage || 0), 0) / monthData.length
    return avg.toFixed(1).replace(".", ",")
  }

  const exportToExcel = () => {
    if (history.length === 0) {
      alert("Não há dados para exportar!")
      return
    }

    let csv =
      "Data\tMédia (%)\tTempo Médio\tMeta Atingida\tFuncionário\tHoras Trabalhadas\tMeta Diária\tPorcentagem Individual (%)\n"

    history.forEach((day) => {
      const metaAtingida = day.averagePercentage >= 90 ? "Sim" : "Não"
      day.employees.forEach((emp) => {
        csv += `${formatDate(day.date)}\t${day.averagePercentage.toFixed(1)}\t${day.averageTime}\t${metaAtingida}\t${emp.name}\t${emp.hours}\t${emp.dailyGoal}\t${emp.percentage.toFixed(1)}\n`
      })
    })

    const blob = new Blob([csv], { type: "text/tab-separated-values;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio_horas_${new Date().toISOString().split("T")[0]}.xlsx`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadImportTemplate = () => {
    let csv = "Data\tFuncionário\tHoras Trabalhadas\tMeta Diária\n"
    csv += "04/11/2025\tRaposo\t08:30\t8:30\n"
    csv += "04/11/2025\tMika\t08:35\t8:30\n"
    csv += "04/11/2025\tLuiz\t08:14\t8:30\n"
    csv += "04/11/2025\tSchutz\t05:16\t6:00\n"
    csv += "04/11/2025\tCaio\t05:14\t6:00\n"
    csv += "04/11/2025\tThiago\t06:03\t6:00\n"

    const blob = new Blob([csv], { type: "text/tab-separated-values;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "modelo_importacao_horas.xlsx")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const importFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const lines = text
          .trim()
          .split("\n")
          .filter((line) => line.trim().length > 0)

        if (lines.length < 2) {
          alert("❌ Arquivo vazio ou inválido!")
          return
        }

        const dataLines = lines.slice(1)
        const dayGroups: { [key: string]: Array<{ name: string; hours: string; dailyGoal: string }> } = {}
        let validRows = 0

        dataLines.forEach((line) => {
          if (!line || !line.trim()) return

          const parts = line
            .trim()
            .split(/\t|,/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0)

          if (parts.length < 3) return

          const dateStr = parts[0]
          const name = parts[1]
          const hours = parts[2]
          const dailyGoal = parts[3] || "8:30"

          if (!dateStr || !name || !hours) return

          let isoDate = ""
          const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
          const yyyymmddRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/

          const ddmmyyyyMatch = dateStr.match(ddmmyyyyRegex)
          const yyyymmddMatch = dateStr.match(yyyymmddRegex)

          if (ddmmyyyyMatch) {
            const [, day, month, year] = ddmmyyyyMatch
            isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
          } else if (yyyymmddMatch) {
            const [, year, month, day] = yyyymmddMatch
            isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
          } else {
            console.log("[v0] Failed to parse date:", dateStr)
            return
          }

          const timeRegex = /^(\d{1,2}):(\d{2})$/
          if (!timeRegex.test(hours)) {
            console.log("[v0] Failed to parse time:", hours)
            return
          }

          validRows++

          if (!dayGroups[isoDate]) {
            dayGroups[isoDate] = []
          }

          dayGroups[isoDate].push({
            name,
            hours,
            dailyGoal,
          })
        })

        console.log("[v0] Valid rows found:", validRows)
        console.log("[v0] Day groups:", dayGroups)

        if (validRows === 0) {
          alert("❌ Nenhuma linha válida encontrada no arquivo!")
          setShowImportModal(false)
          return
        }

        const newHistory = [...history]

        for (const [date, empData] of Object.entries(dayGroups)) {
          const employeesData = empData.map((emp) => ({
            name: emp.name,
            hours: emp.hours,
            dailyGoal: emp.dailyGoal,
            percentage: getNumericPercentage(emp.hours, emp.dailyGoal),
          }))

          const totalPercentage = employeesData.reduce((sum, emp) => sum + emp.percentage, 0)
          const avgPercentage = totalPercentage / employeesData.length

          const totalMinutes = employeesData.reduce((sum, emp) => sum + timeToMinutes(emp.hours), 0)
          const avgMinutes = Math.round(totalMinutes / employeesData.length)
          const avgHours = Math.floor(avgMinutes / 60)
          const avgMins = avgMinutes % 60
          const avgTime = `${avgHours}:${avgMins.toString().padStart(2, "0")}`

          const dayRecord: DailyRecord = {
            date,
            employees: employeesData,
            averagePercentage: avgPercentage,
            averageTime: avgTime,
          }

          const existingIndex = newHistory.findIndex((h) => h.date === date)
          if (existingIndex >= 0) {
            newHistory[existingIndex] = dayRecord
          } else {
            newHistory.push(dayRecord)
          }
        }

        newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setHistory(newHistory)

        localStorage.setItem("work-hours-history", JSON.stringify(newHistory))
        alert(`✅ Importação concluída!\n\n📊 ${Object.keys(dayGroups).length} dia(s) importado(s) com sucesso!`)
        setShowImportModal(false)
      } catch (error) {
        console.log("[v0] Import error:", error)
        alert("❌ Erro ao importar arquivo: " + (error instanceof Error ? error.message : "Desconhecido"))
      }
    }

    reader.readAsText(file, "UTF-8")
    event.target.value = ""
  }

  const formatDate = (dateString: string): string => {
    const [year, month, day] = dateString.split("-")
    return `${day}/${month}/${year}`
  }

  const loadHistoricalDay = (date: string) => {
    const dayData = history.find((h) => h.date === date)
    if (dayData) {
      setEmployees(
        employees.map((emp) => {
          const histEmp = dayData.employees.find((e) => e.name === emp.name)
          return histEmp ? { ...emp, hours: histEmp.hours } : emp
        }),
      )
      setCurrentDate(date)
      setShowHistory(false)
    }
  }

  const clearCurrentDay = () => {
    setEmployees(employees.map((emp) => ({ ...emp, hours: "" })))
    setCurrentDate(new Date().toISOString().split("T")[0])
  }

  const getBarColor = (percentage: number): string => {
    if (percentage >= 90) return "#ff8738" // laranja
    if (percentage >= 70) return "#003a75" // azul
    if (percentage >= 50) return "#ffa500" // amarelo
    return "#ef4444" // vermelho
  }

  const CustomBar = (props: any) => {
    const { fill, x, y, width, height, payload } = props
    const barColor = getBarColor(payload.percentage)
    return <rect x={x} y={y} width={width} height={height} fill={barColor} radius={[8, 8, 0, 0]} />
  }

  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, index, value } = props
    const dataPoint = getChartData()[index]

    if (!dataPoint) return null

    const barColor = getBarColor(dataPoint.percentage)

    return (
      <g>
        {/* Hora trabalahada */}
        <text x={x + width / 2} y={y - 50} textAnchor="middle" fill="#000000" fontSize={12} fontWeight="bold">
          {dataPoint.hoursWorked}
        </text>
        {/* Porcentagem com cor ciano/turquesa */}
        <text x={x + width / 2} y={y - 30} textAnchor="middle" fill="#00bcd4" fontSize={13} fontWeight="bold">
          {dataPoint.displayPercentage}%
        </text>
      </g>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8" style={{ color: "#003a75" }} />
            <h1 className="text-4xl font-bold" style={{ color: "#003a75" }}>
              Calculadora de Horas
            </h1>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2`}
            style={{
              backgroundColor: showHistory ? "#ff8738" : "#003a75",
              color: "#ffffff",
            }}
          >
            <History className="w-5 h-5" />
            {showHistory ? "Voltar" : "Ver Histórico"}
          </button>
        </div>

        {showHistory ? (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#ffffff", borderColor: "#003a75" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5" style={{ color: "#003a75" }} />
                  <h3 className="font-semibold text-gray-700">Média Semanal (7 dias)</h3>
                </div>
                <p className="text-4xl font-bold" style={{ color: "#003a75" }}>
                  {calculateWeeklyAverage()}%
                </p>
                <p className="text-sm text-gray-600 mt-1">{getWeekData().length} dias registrados</p>
              </div>

              <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#ffffff", borderColor: "#ff8738" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5" style={{ color: "#ff8738" }} />
                  <h3 className="font-semibold text-gray-700">Média Mensal</h3>
                </div>
                <p className="text-4xl font-bold" style={{ color: "#ff8738" }}>
                  {calculateMonthlyAverage()}%
                </p>
                <p className="text-sm text-gray-600 mt-1">{getMonthData().length} dias registrados</p>
              </div>
            </div>

            {/* Week Chart */}
            {getWeekData().length > 0 && (
              <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#ffffff", borderColor: "#003a75" }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: "#003a75" }}>
                  Evolução dos Últimos 7 Dias
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={getWeekData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                      }
                      tick={{ fill: "#4b5563", fontSize: 12 }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fill: "#4b5563", fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={(date) => formatDate(date)}
                      formatter={(value) => [`${(value as number).toFixed(1).replace(".", ",")}%`, "Média"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="averagePercentage"
                      stroke="#003a75"
                      strokeWidth={3}
                      dot={{ fill: "#003a75", r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Detailed Report Section */}
            <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#ffffff", borderColor: "#003a75" }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: "#003a75" }}>
                📊 Relatório Detalhado por Dia
              </h3>

              {history.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhum dia registrado ainda. Salve o primeiro dia para começar o histórico!
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((day) => (
                    <div
                      key={day.date}
                      className="p-4 rounded-lg border-2 bg-gray-50"
                      style={{ borderColor: "#e5e5e5" }}
                    >
                      <div className="flex items-center justify-between mb-3 flex-col md:flex-row gap-4">
                        <div>
                          <h4 className="text-lg font-bold" style={{ color: "#003a75" }}>
                            {formatDate(day.date)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Tempo Médio: <strong>{day.averageTime}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div
                            className="px-4 py-2 rounded-lg font-bold"
                            style={{
                              backgroundColor:
                                day.averagePercentage >= 90
                                  ? "#ffe6d5"
                                  : day.averagePercentage >= 70
                                    ? "#e6f0ff"
                                    : "#fff4e6",
                              color:
                                day.averagePercentage >= 90
                                  ? "#ff8738"
                                  : day.averagePercentage >= 70
                                    ? "#003a75"
                                    : "#ff8738",
                            }}
                          >
                            {day.averagePercentage.toFixed(1).replace(".", ",")}%
                          </div>
                          <button
                            onClick={() => deleteDay(day.date)}
                            className="px-3 py-2 text-white rounded-lg hover:opacity-80 transition-colors font-semibold text-sm"
                            style={{ backgroundColor: "#ef4444" }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Deletar
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {day.employees.map((emp, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white rounded border-l-4"
                            style={{ borderLeftColor: "#003a75" }}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-sm" style={{ color: "#003a75" }}>
                                {emp.name}
                              </span>
                              <span
                                className="px-2 py-1 rounded text-xs font-bold"
                                style={{
                                  backgroundColor:
                                    emp.percentage >= 90
                                      ? "#ffe6d5"
                                      : emp.percentage >= 70
                                        ? "#e6f0ff"
                                        : emp.percentage >= 50
                                          ? "#fff4e6"
                                          : "#fee2e2",
                                  color:
                                    emp.percentage >= 90
                                      ? "#ff8738"
                                      : emp.percentage >= 70
                                        ? "#003a75"
                                        : emp.percentage >= 50
                                          ? "#ff8738"
                                          : "#991b1b",
                                }}
                              >
                                {emp.percentage.toFixed(1).replace(".", ",")}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              <p>
                                <strong>Horas:</strong> {emp.hours}
                              </p>
                              <p>
                                <strong>Meta:</strong> {emp.dailyGoal}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Table */}
            <div
              className="p-6 rounded-lg border-2 overflow-x-auto"
              style={{ backgroundColor: "#ffffff", borderColor: "#003a75" }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: "#003a75" }}>
                📋 Resumo dos Dias
              </h3>
              {history.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhum dia registrado ainda.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #003a75" }}>
                      <th className="px-4 py-3 text-left font-semibold" style={{ color: "#003a75" }}>
                        Data
                      </th>
                      <th className="px-4 py-3 text-center font-semibold" style={{ color: "#003a75" }}>
                        Média %
                      </th>
                      <th className="px-4 py-3 text-center font-semibold" style={{ color: "#003a75" }}>
                        Tempo Médio
                      </th>
                      <th className="px-4 py-3 text-center font-semibold" style={{ color: "#003a75" }}>
                        Status
                      </th>
                      <th className="px-4 py-3 text-center font-semibold" style={{ color: "#003a75" }}>
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((day) => (
                      <tr key={day.date} style={{ borderBottom: "1px solid #e5e5e5" }}>
                        <td className="px-4 py-3 font-semibold">{formatDate(day.date)}</td>
                        <td className="px-4 py-3 text-center">
                          <span style={{ color: "#003a75", fontWeight: "bold" }}>
                            {day.averagePercentage.toFixed(1).replace(".", ",")}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">{day.averageTime}</td>
                        <td className="px-4 py-3 text-center">
                          {day.averagePercentage >= 90 ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                              ✓ Meta
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">
                              Faltou {(90 - day.averagePercentage).toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => loadHistoricalDay(day.date)}
                            className="px-3 py-1 rounded text-xs font-semibold text-white"
                            style={{ backgroundColor: "#003a75" }}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Export and Import Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={exportToExcel}
                className="py-4 text-white rounded-lg font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: "#ff8738" }}
              >
                <Download className="w-5 h-5" />
                Exportar Relatório Completo
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="py-4 text-white rounded-lg font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: "#003a75" }}
              >
                <Upload className="w-5 h-5" />
                Importar Apontamentos
              </button>
            </div>

            {/* Import Modal */}
            {showImportModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div
                  className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full border-2"
                  style={{ borderColor: "#003a75" }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold" style={{ color: "#003a75" }}>
                      Importar Apontamentos
                    </h2>
                    <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={downloadImportTemplate}
                      className="w-full py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                      style={{ backgroundColor: "#ff8738" }}
                    >
                      <Download className="w-5 h-5" />
                      Baixar Modelo Excel
                    </button>

                    <div>
                      <label className="block text-sm font-semibold mb-3" style={{ color: "#003a75" }}>
                        Selecionar arquivo
                      </label>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv,.txt"
                        onChange={importFromFile}
                        className="w-full px-4 py-3 border-2 rounded-lg cursor-pointer focus:outline-none"
                        style={{
                          borderColor: "#003a75",
                        }}
                      />
                    </div>

                    <button
                      onClick={() => setShowImportModal(false)}
                      className="w-full py-3 rounded-lg font-semibold border-2 transition-colors"
                      style={{ backgroundColor: "#ffffff", color: "#003a75", borderColor: "#003a75" }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Date and Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#ffffff", borderColor: "#003a75" }}>
                <label className="block text-sm font-semibold mb-3" style={{ color: "#003a75" }}>
                  📅 Data do Apontamento
                </label>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none"
                  style={{ borderColor: "#003a75" }}
                />
              </div>

              <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#ffffff", borderColor: "#ff8738" }}>
                <label className="block text-sm font-semibold mb-3" style={{ color: "#ff8738" }}>
                  🎯 Meta da Equipe
                </label>
                <p className="text-4xl font-bold" style={{ color: "#ff8738" }}>
                  90%
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={clearCurrentDay}
                  className="px-3 py-1 rounded-lg font-semibold border-2 transition-colors text-sm"
                  style={{ backgroundColor: "#ffffff", color: "#003a75", borderColor: "#d1d5db" }}
                >
                  🆕 Novo Dia
                </button>
                {history.find((h) => h.date === currentDate) && (
                  <div className="flex items-center px-4 py-2 bg-amber-100 border-2 border-amber-300 rounded-lg">
                    <span className="text-amber-800 font-bold text-xs">⚠️ Já registrado</span>
                  </div>
                )}
              </div>
            </div>

            {/* Employees Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#003a75" }}>
                Funcionários
              </h2>

              <div className="space-y-3">
                {employees.map((employee, index) => {
                  const percentage = calculatePercentage(employee.hours, employee.dailyGoal)

                  return (
                    <div
                      key={employee.id}
                      className="flex gap-4 items-stretch p-4 rounded-lg border-2 flex-col md:flex-row md:items-center"
                      style={{ backgroundColor: "#f5f5f5", borderColor: "#e5e5e5" }}
                    >
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={employee.name}
                          onChange={(e) => updateEmployee(employee.id, "name", e.target.value)}
                          placeholder={`Funcionário ${index + 1}`}
                          className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none"
                          style={{ borderColor: "#003a75" }}
                        />
                      </div>

                      <div className="w-full md:w-24">
                        <label className="text-xs text-gray-500 block mb-1 font-semibold">Meta</label>
                        <div
                          className="w-full px-3 py-2 border-2 rounded-lg text-center bg-gray-200 font-semibold text-sm"
                          style={{ color: "#003a75", borderColor: "#e5e5e5" }}
                        >
                          {employee.dailyGoal}
                        </div>
                      </div>

                      <div className="w-full md:w-28">
                        <label className="text-xs text-gray-500 block mb-1 font-semibold">Horas</label>
                        <input
                          id={`hours-input-${index}`}
                          type="text"
                          value={employee.hours}
                          onChange={(e) => handleTimeChange(employee.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          placeholder="00:00"
                          maxLength={5}
                          className="w-full px-3 py-2 border-2 rounded-lg text-center focus:outline-none font-mono"
                          style={{ borderColor: "#003a75" }}
                        />
                      </div>

                      <div
                        className="w-full md:w-24 flex items-center justify-center rounded-lg py-2 px-4 font-bold text-white"
                        style={{ backgroundColor: "#e8d7d0" }}
                      >
                        <span style={{ color: "#ff8738" }}>{employee.hours ? percentage : "0,0"}%</span>
                      </div>

                      <button
                        onClick={() => removeEmployee(employee.id)}
                        className="px-2 py-2 text-white rounded-lg hover:opacity-80 transition-colors font-semibold text-sm"
                        style={{ backgroundColor: "#fee2e2" }}
                      >
                        <span style={{ color: "#ef4444" }}>✕</span>
                      </button>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={addEmployee}
                className="w-full mt-4 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition-colors text-sm"
                style={{ backgroundColor: "#003a75" }}
              >
                + Adicionar Funcionário
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={saveToHistory}
              className="w-full py-4 text-white rounded-lg font-bold text-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 mb-8"
              style={{ backgroundColor: "#ff8738" }}
            >
              <Save className="w-5 h-5" />
              Salvar Dia {formatDate(currentDate)}
            </button>

            {/* Charts Section */}
            {getChartData().length > 0 && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div
                    className="p-6 rounded-lg border-2"
                    style={{ backgroundColor: "#ffffff", borderColor: "#ff8738" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5" style={{ color: "#ff8738" }} />
                      <h3 className="font-semibold text-gray-700">Tempo Médio</h3>
                    </div>
                    <p className="text-4xl font-bold" style={{ color: "#ff8738" }}>
                      {calculateAverageTime()}
                    </p>
                  </div>

                  <div
                    className="p-6 rounded-lg border-2"
                    style={{ backgroundColor: "#ffffff", borderColor: "#003a75" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5" style={{ color: "#003a75" }} />
                      <h3 className="font-semibold text-gray-700">Média da Equipe</h3>
                    </div>
                    <p className="text-4xl font-bold" style={{ color: "#003a75" }}>
                      {calculateAveragePercentage()}%
                    </p>
                    {Number.parseFloat(calculateAveragePercentage().replace(",", ".")) >= 90 ? (
                      <p className="text-sm mt-2 font-semibold" style={{ color: "#ff8738" }}>
                        ✓ Meta atingida!
                      </p>
                    ) : (
                      <p className="text-sm mt-2 font-semibold" style={{ color: "#ff8738" }}>
                        Faltam{" "}
                        {(90 - Number.parseFloat(calculateAveragePercentage().replace(",", ".")))
                          .toFixed(1)
                          .replace(".", ",")}
                        %
                      </p>
                    )}
                  </div>
                </div>

                {/* Chart */}
                <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#ffffff", borderColor: "#003a75" }}>
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-6 h-6" style={{ color: "#003a75" }} />
                    <h3 className="text-xl font-bold" style={{ color: "#003a75" }}>
                      Porcentagem Trabalhada por Funcionário
                    </h3>
                  </div>

                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={getChartData()} margin={{ top: 100, right: 20, left: 0, bottom: 80 }}>
                      <CartesianGrid stroke="#e5e7eb" vertical={true} horizontal={true} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#4b5563", fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis tick={{ fill: "#4b5563", fontSize: 12 }} domain={[0, 120]} width={50} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="percentage" shape={<CustomBar />}>
                        <LabelList
                          dataKey="hoursWorked"
                          position="top"
                          fill="#000000"
                          fontSize={12}
                          fontWeight="bold"
                          offset={45}
                        />
                        <LabelList
                          dataKey="displayPercentage"
                          position="top"
                          fill="#00bcd4"
                          fontSize={13}
                          fontWeight="bold"
                          offset={25}
                          formatter={(value) => `${value}%`}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="flex gap-6 justify-center mt-6 text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ff8738" }}></div>
                      <span className="text-gray-600 font-semibold">≥90%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#003a75" }}></div>
                      <span className="text-gray-600 font-semibold">70-89%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ffa500" }}></div>
                      <span className="text-gray-600 font-semibold">50-69%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ef4444" }}></div>
                      <span className="text-gray-600 font-semibold">&lt;50%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
