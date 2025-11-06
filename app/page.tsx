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
    let csv =
      "Data\tMédia (%)\tTempo Médio\tMeta Atingida\tFuncionário\tHoras Trabalhadas\tMeta Diária\tPorcentagem Individual (%)\n"
    csv += "04/11/2025\t95.4\t6:52\tSim\tRaposo\t07:59\t8:30\t93.9\n"
    csv += "04/11/2025\t95.4\t6:52\tSim\tMika\t08:49\t8:30\t103.7\n"
    csv += "04/11/2025\t95.4\t6:52\tSim\tLuiz\t06:33\t8:30\t77.1\n"
    csv += "04/11/2025\t95.4\t6:52\tSim\tSchutz\t06:06\t6:00\t101.7\n"
    csv += "04/11/2025\t95.4\t6:52\tSim\tCaio\t05:44\t6:00\t95.6\n"
    csv += "04/11/2025\t95.4\t6:52\tSim\tThiago\t06:01\t6:00\t100.3\n"

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
    if (percentage >= 90) return "#22c55e" // green
    if (percentage >= 70) return "#ff8738" // orange
    if (percentage >= 50) return "#003a75" // blue
    return "#ef4444" // red
  }

  const CustomBar = (props: any) => {
    const { x, y, width, height, index } = props
    const dataPoint = getChartData()[index]

    if (!dataPoint) {
      return <rect x={x} y={y} width={width} height={height} fill="#d1d5db" radius={[8, 8, 0, 0]} />
    }

    const barColor = getBarColor(dataPoint.percentage)
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
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <Clock className="w-6 md:w-8 h-6 md:h-8" style={{ color: "#003a75" }} />
            <h1 className="text-2xl md:text-4xl font-bold" style={{ color: "#003a75" }}>
              Calculadora de Horas
            </h1>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm md:text-base`}
            style={{
              backgroundColor: showHistory ? "#ff8738" : "#003a75",
              color: "#ffffff",
            }}
          >
            <History className="w-4 md:w-5 h-4 md:h-5" />
            {showHistory ? "Voltar" : "Ver Histórico"}
          </button>
        </div>

        {showHistory ? (
          <div className="space-y-4 md:space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <div
                className="p-4 md:p-6 rounded-lg border-2"
                style={{ backgroundColor: "#ffffff", borderColor: "#003a75" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 md:w-5 h-4 md:h-5" style={{ color: "#003a75" }} />
                  <h3 className="font-semibold text-sm md:text-base text-gray-700">Média Semanal (7 dias)</h3>
                </div>
                <p className="text-3xl md:text-4xl font-bold" style={{ color: "#003a75" }}>
                  {calculateWeeklyAverage()}%
                </p>
                <p className="text-xs md:text-sm text-gray-600 mt-1">{getWeekData().length} dias registrados</p>
              </div>

              <div
                className="p-4 md:p-6 rounded-lg border-2"
                style={{ backgroundColor: "#ffffff", borderColor: "#ff8738" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 md:w-5 h-4 md:h-5" style={{ color: "#ff8738" }} />
                  <h3 className="font-semibold text-sm md:text-base text-gray-700">Média Mensal</h3>
                </div>
                <p className="text-3xl md:text-4xl font-bold" style={{ color: "#ff8738" }}>
                  {calculateMonthlyAverage()}%
                </p>
                <p className="text-xs md:text-sm text-gray-600 mt-1">{getMonthData().length} dias registrados</p>
              </div>
            </div>

            {/* Week Chart */}
            {getWeekData().length > 0 && (
              <div
                className="p-4 md:p-6 rounded-lg border-2"
                style={{ backgroundColor: "#ffffff", borderColor: "#003a75" }}
              >
                <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4" style={{ color: "#003a75" }}>
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
                      tick={{ fill: "#4b5563", fontSize: 11 }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fill: "#4b5563", fontSize: 11 }} />
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
            <div
              className="p-4 md:p-6 rounded-lg border-2"
              style={{ backgroundColor: "#ffffff", borderColor: "#003a75" }}
            >
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4" style={{ color: "#003a75" }}>
                📊 Relatório Detalhado por Dia
              </h3>

              {history.length === 0 ? (
                <div className="p-6 md:p-8 text-center text-gray-500 text-sm md:text-base">
                  Nenhum dia registrado ainda. Salve o primeiro dia para começar o histórico!
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {history.map((day) => (
                    <div
                      key={day.date}
                      className="p-3 md:p-4 rounded-lg border-2 bg-gray-50"
                      style={{ borderColor: "#e5e5e5" }}
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 gap-2 md:gap-4">
                        <div>
                          <h4 className="text-base md:text-lg font-bold" style={{ color: "#003a75" }}>
                            {formatDate(day.date)}
                          </h4>
                          <p className="text-xs md:text-sm text-gray-600">
                            Tempo Médio: <strong>{day.averageTime}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <div
                            className="px-3 md:px-4 py-2 rounded-lg font-bold text-sm"
                            style={{
                              backgroundColor:
                                day.averagePercentage >= 90
                                  ? "#e8f5e9"
                                  : day.averagePercentage >= 70
                                    ? "#ffe6d5"
                                    : "#fff4e6",
                              color:
                                day.averagePercentage >= 90
                                  ? "#22c55e"
                                  : day.averagePercentage >= 70
                                    ? "#ff8738"
                                    : "#ff8738",
                            }}
                          >
                            {day.averagePercentage.toFixed(1).replace(".", ",")}%
                          </div>
                          <button
                            onClick={() => deleteDay(day.date)}
                            className="px-2 md:px-3 py-2 text-white rounded-lg hover:opacity-80 transition-colors font-semibold text-xs md:text-sm"
                            style={{ backgroundColor: "#ef4444" }}
                          >
                            <Trash2 className="w-3 md:w-4 h-3 md:h-4" />
                            <span className="hidden md:inline ml-1">Deletar</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {day.employees.map((emp, idx) => (
                          <div
                            key={idx}
                            className="p-2 md:p-3 bg-white rounded border-l-4 text-sm"
                            style={{ borderLeftColor: "#003a75" }}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-xs md:text-sm" style={{ color: "#003a75" }}>
                                {emp.name}
                              </span>
                              <span
                                className="px-2 py-1 rounded text-xs font-bold"
                                style={{
                                  backgroundColor:
                                    emp.percentage >= 90
                                      ? "#e8f5e9"
                                      : emp.percentage >= 70
                                        ? "#ffe6d5"
                                        : emp.percentage >= 50
                                          ? "#fff4e6"
                                          : "#fee2e2",
                                  color:
                                    emp.percentage >= 90
                                      ? "#22c55e"
                                      : emp.percentage >= 70
                                        ? "#ff8738"
                                        : emp.percentage >= 50
                                          ? "#ff8738"
                                          : "#991b1b",
                                }}
                              >
                                {emp.percentage.toFixed(1).replace(".", ",")}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
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
              className="p-3 md:p-6 rounded-lg border-2 overflow-x-auto"
              style={{ backgroundColor: "#ffffff", borderColor: "#003a75" }}
            >
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4" style={{ color: "#003a75" }}>
                📋 Resumo dos Dias
              </h3>
              {history.length === 0 ? (
                <div className="p-6 md:p-8 text-center text-gray-500 text-sm">Nenhum dia registrado ainda.</div>
              ) : (
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #003a75" }}>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold" style={{ color: "#003a75" }}>
                        Data
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center font-semibold" style={{ color: "#003a75" }}>
                        Média %
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center font-semibold" style={{ color: "#003a75" }}>
                        Tempo
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center font-semibold" style={{ color: "#003a75" }}>
                        Status
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center font-semibold" style={{ color: "#003a75" }}>
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((day) => (
                      <tr key={day.date} style={{ borderBottom: "1px solid #e5e5e5" }}>
                        <td className="px-2 md:px-4 py-2 md:py-3 font-semibold text-xs md:text-sm">
                          {formatDate(day.date)}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                          <span style={{ color: "#003a75", fontWeight: "bold" }} className="text-xs md:text-sm">
                            {day.averagePercentage.toFixed(1).replace(".", ",")}%
                          </span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm">{day.averageTime}</td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                          {day.averagePercentage >= 90 ? (
                            <span className="px-2 md:px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                              ✓ Meta
                            </span>
                          ) : (
                            <span className="px-2 md:px-3 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">
                              Faltou {(90 - day.averagePercentage).toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                          <button
                            onClick={() => loadHistoricalDay(day.date)}
                            className="px-2 md:px-3 py-1 rounded text-xs font-semibold text-white"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <button
                onClick={exportToExcel}
                className="py-3 md:py-4 text-white rounded-lg font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                style={{ backgroundColor: "#ff8738" }}
              >
                <Download className="w-4 md:w-5 h-4 md:h-5" />
                Exportar Relatório
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="py-3 md:py-4 text-white rounded-lg font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                style={{ backgroundColor: "#003a75" }}
              >
                <Upload className="w-4 md:w-5 h-4 md:h-5" />
                Importar Apontamentos
              </button>
            </div>

            {/* Import Modal */}
            {showImportModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div
                  className="bg-white rounded-lg shadow-2xl p-6 md:p-8 max-w-md w-full border-2"
                  style={{ borderColor: "#003a75" }}
                >
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-bold" style={{ color: "#003a75" }}>
                      Importar Apontamentos
                    </h2>
                    <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 md:w-6 h-5 md:h-6" />
                    </button>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <button
                      onClick={downloadImportTemplate}
                      className="w-full py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                      style={{ backgroundColor: "#ff8738" }}
                    >
                      <Download className="w-4 md:w-5 h-4 md:h-5" />
                      Baixar Modelo Excel
                    </button>

                    <div>
                      <label
                        className="block text-xs md:text-sm font-semibold mb-2 md:mb-3"
                        style={{ color: "#003a75" }}
                      >
                        Selecionar arquivo
                      </label>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv,.txt"
                        onChange={importFromFile}
                        className="w-full px-3 md:px-4 py-2 md:py-3 border-2 rounded-lg cursor-pointer focus:outline-none text-sm"
                        style={{
                          borderColor: "#003a75",
                        }}
                      />
                    </div>

                    <button
                      onClick={() => setShowImportModal(false)}
                      className="w-full py-2 md:py-3 rounded-lg font-semibold border-2 transition-colors text-sm md:text-base"
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
          <div className="space-y-4 md:space-y-6">
            {/* Date and Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
              <div
                className="p-4 md:p-6 rounded-lg border-2"
                style={{ backgroundColor: "#ffffff", borderColor: "#003a75" }}
              >
                <label className="block text-xs md:text-sm font-semibold mb-2 md:mb-3" style={{ color: "#003a75" }}>
                  📅 Data do Apontamento
                </label>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 md:px-4 py-2 md:py-2 border-2 rounded-lg focus:outline-none text-sm"
                  style={{ borderColor: "#003a75" }}
                />
              </div>

              <div
                className="p-4 md:p-6 rounded-lg border-2"
                style={{ backgroundColor: "#ffffff", borderColor: "#ff8738" }}
              >
                <label className="block text-xs md:text-sm font-semibold mb-2 md:mb-3" style={{ color: "#ff8738" }}>
                  🎯 Meta da Equipe
                </label>
                <p className="text-3xl md:text-4xl font-bold" style={{ color: "#ff8738" }}>
                  90%
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 md:flex-1">
                <button
                  onClick={clearCurrentDay}
                  className="px-3 md:px-4 py-2 md:py-3 rounded-lg font-semibold border-2 transition-colors text-xs md:text-sm flex-1"
                  style={{ backgroundColor: "#ffffff", color: "#003a75", borderColor: "#d1d5db" }}
                >
                  🆕 Novo Dia
                </button>
                {history.find((h) => h.date === currentDate) && (
                  <div className="flex items-center px-3 md:px-4 py-2 md:py-3 bg-amber-100 border-2 border-amber-300 rounded-lg flex-1 text-xs md:text-sm">
                    <span className="text-amber-800 font-bold">⚠️ Já registrado</span>
                  </div>
                )}
              </div>
            </div>

            {/* Employees Section */}
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4" style={{ color: "#003a75" }}>
                Funcionários
              </h2>

              <div className="space-y-2 md:space-y-3">
                {employees.map((employee, index) => {
                  const percentage = calculatePercentage(employee.hours, employee.dailyGoal)

                  return (
                    <div
                      key={employee.id}
                      className="flex gap-2 md:gap-4 items-stretch p-3 md:p-4 rounded-lg border-2 flex-col md:flex-row md:items-center"
                      style={{ backgroundColor: "#f5f5f5", borderColor: "#e5e5e5" }}
                    >
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={employee.name}
                          onChange={(e) => updateEmployee(employee.id, "name", e.target.value)}
                          placeholder={`Funcionário ${index + 1}`}
                          className="w-full px-3 md:px-4 py-2 border-2 rounded-lg focus:outline-none text-sm"
                          style={{ borderColor: "#003a75" }}
                        />
                      </div>

                      <div className="w-full md:w-24">
                        <label className="text-xs text-gray-500 block mb-1 font-semibold">Meta</label>
                        <div
                          className="w-full px-3 py-2 border-2 rounded-lg text-center bg-gray-200 font-semibold text-xs md:text-sm"
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
                          className="w-full px-3 py-2 border-2 rounded-lg text-center focus:outline-none font-mono text-sm"
                          style={{ borderColor: "#003a75" }}
                        />
                      </div>

                      <div
                        className="w-full md:w-24 flex items-center justify-center rounded-lg py-2 px-3 md:px-4 font-bold text-white text-sm"
                        style={{ backgroundColor: "#e8d7d0" }}
                      >
                        <span style={{ color: "#ff8738" }}>{employee.hours ? percentage : "0,0"}%</span>
                      </div>

                      <button
                        onClick={() => removeEmployee(employee.id)}
                        className="px-2 md:px-3 py-2 text-white rounded-lg hover:opacity-80 transition-colors font-semibold text-xs md:text-sm"
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
                className="w-full mt-3 md:mt-4 py-2 md:py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-colors text-sm md:text-base"
                style={{ backgroundColor: "#003a75" }}
              >
                + Adicionar Funcionário
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={saveToHistory}
              className="w-full py-3 md:py-4 text-white rounded-lg font-bold text-base md:text-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 mb-6 md:mb-8"
              style={{ backgroundColor: "#ff8738" }}
            >
              <Save className="w-4 md:w-5 h-4 md:h-5" />
              Salvar Dia {formatDate(currentDate)}
            </button>

            {/* Charts Section */}
            {getChartData().length > 0 && (
              <div className="space-y-4 md:space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                  <div
                    className="p-4 md:p-6 rounded-lg border-2"
                    style={{ backgroundColor: "#ffffff", borderColor: "#ff8738" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 md:w-5 h-4 md:h-5" style={{ color: "#ff8738" }} />
                      <h3 className="font-semibold text-sm md:text-base text-gray-700">Tempo Médio</h3>
                    </div>
                    <p className="text-3xl md:text-4xl font-bold" style={{ color: "#ff8738" }}>
                      {calculateAverageTime()}
                    </p>
                  </div>

                  <div
                    className="p-4 md:p-6 rounded-lg border-2"
                    style={{ backgroundColor: "#ffffff", borderColor: "#003a75" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 md:w-5 h-4 md:h-5" style={{ color: "#003a75" }} />
                      <h3 className="font-semibold text-sm md:text-base text-gray-700">Média da Equipe</h3>
                    </div>
                    <p className="text-3xl md:text-4xl font-bold" style={{ color: "#003a75" }}>
                      {calculateAveragePercentage()}%
                    </p>
                    {Number.parseFloat(calculateAveragePercentage().replace(",", ".")) >= 90 ? (
                      <p className="text-xs md:text-sm mt-2 font-semibold" style={{ color: "#ff8738" }}>
                        ✓ Meta atingida!
                      </p>
                    ) : (
                      <p className="text-xs md:text-sm mt-2 font-semibold" style={{ color: "#ff8738" }}>
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
                <div
                  className="p-4 md:p-6 rounded-lg border-2"
                  style={{ backgroundColor: "#ffffff", borderColor: "#003a75" }}
                >
                  <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <BarChart3 className="w-5 md:w-6 h-5 md:h-6" style={{ color: "#003a75" }} />
                    <h3 className="text-lg md:text-xl font-bold" style={{ color: "#003a75" }}>
                      Porcentagem Trabalhada
                    </h3>
                  </div>

                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={getChartData()} margin={{ top: 100, right: 20, left: 0, bottom: 80 }}>
                      <CartesianGrid stroke="#e5e7eb" vertical={true} horizontal={true} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#4b5563", fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis tick={{ fill: "#4b5563", fontSize: 11 }} domain={[0, 120]} width={50} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="percentage" shape={<CustomBar />} isAnimationActive={false}>
                        <LabelList
                          dataKey="hoursWorked"
                          position="top"
                          fill="#000000"
                          fontSize={12}
                          fontWeight="bold"
                          offset={55}
                        />
                        <LabelList
                          dataKey="displayPercentage"
                          position="top"
                          fill="#00bcd4"
                          fontSize={13}
                          fontWeight="bold"
                          offset={35}
                          formatter={(value) => `${value}%`}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="flex gap-3 md:gap-6 justify-center mt-4 md:mt-6 text-xs md:text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-3 md:w-4 h-3 md:h-4 rounded" style={{ backgroundColor: "#22c55e" }}></div>
                      <span className="text-gray-600 font-semibold">≥90%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 md:w-4 h-3 md:h-4 rounded" style={{ backgroundColor: "#ff8738" }}></div>
                      <span className="text-gray-600 font-semibold">70-89%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 md:w-4 h-3 md:h-4 rounded" style={{ backgroundColor: "#003a75" }}></div>
                      <span className="text-gray-600 font-semibold">50-69%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 md:w-4 h-3 md:h-4 rounded" style={{ backgroundColor: "#ef4444" }}></div>
                      <span className="text-gray-600 font-semibold">&lt;50%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Import and Export Section with Enhanced Colors */}
            {!getChartData().length && (
              <button
                onClick={addEmployee}
                className="w-full mt-3 md:mt-4 py-2 md:py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-colors text-sm md:text-base"
                style={{ backgroundColor: "#003a75" }}
              >
                + Adicionar Funcionário
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
