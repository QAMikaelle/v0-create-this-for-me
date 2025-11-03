"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Clock, Percent, BarChart3, Users, Calendar, History, Save } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
        <div className="bg-white p-3 rounded-lg shadow-lg border-2 border-indigo-200">
          <p className="font-semibold text-gray-800">{payload[0].payload.name}</p>
          <p className="text-indigo-600 font-bold">{payload[0].payload.displayPercentage}%</p>
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
      "Data,Média (%),Tempo Médio,Meta Atingida,Funcionário,Horas Trabalhadas,Meta Diária,Porcentagem Individual\n"

    history.forEach((day) => {
      const metaAtingida = day.averagePercentage >= 90 ? "Sim" : "Não"
      day.employees.forEach((emp) => {
        csv += `${formatDate(day.date)},${day.averagePercentage.toFixed(1)},${day.averageTime},${metaAtingida},${emp.name},${emp.hours},${emp.dailyGoal},${emp.percentage.toFixed(1)}\n`
      })
    })

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio_horas_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Calculadora de Horas Trabalhadas</h1>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`ml-auto px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                showHistory ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
              }`}
            >
              <History className="w-5 h-5" />
              {showHistory ? "Voltar" : "Ver Histórico"}
            </button>
          </div>

          {!showHistory ? (
            <>
              <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
                <div className="flex items-center justify-between gap-4 flex-col md:flex-row">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Data do Apontamento</label>
                    <input
                      type="date"
                      value={currentDate}
                      onChange={(e) => setCurrentDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg text-lg font-semibold focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Selecione a data para adicionar ou editar o apontamento
                    </p>
                  </div>

                  {history.find((h) => h.date === currentDate) && (
                    <div className="px-4 py-2 bg-amber-100 border-2 border-amber-300 rounded-lg text-center">
                      <span className="text-amber-800 font-bold text-sm">⚠️ Dia já registrado</span>
                      <p className="text-xs text-amber-700 mt-1">Salvar irá atualizar</p>
                    </div>
                  )}

                  <button
                    onClick={clearCurrentDay}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors border-2 border-gray-300"
                  >
                    🆕 Novo Dia
                  </button>
                </div>
              </div>

              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-indigo-50 rounded-xl">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jornada de Trabalho Padrão</label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="text"
                      value={workTime}
                      onChange={(e) => setWorkTime(e.target.value)}
                      placeholder="8:30"
                      className="px-4 py-3 border-2 border-indigo-200 rounded-lg w-32 text-lg font-semibold focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-gray-600">({timeToMinutes(workTime)} minutos)</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Exemplos comuns: 8:30 ou 6:00</p>
                </div>

                <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🎯 Meta da Equipe</label>
                  <div className="flex items-center gap-2">
                    <span className="text-5xl font-bold text-green-600">90%</span>
                  </div>
                  <p className="text-sm text-green-700 mt-2 font-medium">Objetivo diário de produtividade</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Funcionários</h2>

                {employees.map((employee, index) => {
                  const percentage = calculatePercentage(employee.hours, employee.dailyGoal)

                  return (
                    <div
                      key={employee.id}
                      className="flex gap-4 items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex-col md:flex-row"
                    >
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={employee.name}
                          onChange={(e) => updateEmployee(employee.id, "name", e.target.value)}
                          placeholder={`Funcionário ${index + 1}`}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="w-full md:w-28">
                        <label className="text-xs text-gray-500 block mb-1">Meta Diária</label>
                        <div className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-center bg-gray-100 font-semibold text-gray-700">
                          {employee.dailyGoal}
                        </div>
                      </div>

                      <div className="w-full md:w-32">
                        <label className="text-xs text-gray-500 block mb-1">Horas Trabalhadas</label>
                        <input
                          id={`hours-input-${index}`}
                          type="text"
                          value={employee.hours}
                          onChange={(e) => handleTimeChange(employee.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          placeholder="00:00"
                          maxLength={5}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-center focus:outline-none focus:border-indigo-500 font-mono text-lg"
                        />
                      </div>

                      <div className="w-full md:w-32 flex items-center justify-center gap-2 bg-indigo-100 rounded-lg py-2 px-4">
                        <Percent className="w-4 h-4 text-indigo-600" />
                        <span className="text-xl font-bold text-indigo-600">{employee.hours ? percentage : "-"}</span>
                      </div>

                      <button
                        onClick={() => removeEmployee(employee.id)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-semibold"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={addEmployee}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
              >
                + Adicionar Funcionário
              </button>

              <button
                onClick={saveToHistory}
                className="w-full mt-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {history.find((h) => h.date === currentDate)
                  ? `Atualizar Dia ${formatDate(currentDate)}`
                  : `Salvar Dia ${formatDate(currentDate)}`}
              </button>

              {getChartData().length > 0 && (
                <div className="mt-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-700">Tempo Médio</h3>
                      </div>
                      <p className="text-3xl font-bold text-green-600">{calculateAverageTime()}</p>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-300">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-gray-700">Média da Equipe</h3>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-purple-600">{calculateAveragePercentage()}%</p>
                        {Number.parseFloat(calculateAveragePercentage().replace(",", ".")) >= 90 ? (
                          <span className="text-green-600 font-bold text-lg">✓ Meta atingida!</span>
                        ) : (
                          <span className="text-amber-600 font-bold text-lg">
                            Faltam{" "}
                            {(90 - Number.parseFloat(calculateAveragePercentage().replace(",", ".")))
                              .toFixed(1)
                              .replace(".", ",")}
                            %
                          </span>
                        )}
                      </div>
                      <div className="mt-3 bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            Number.parseFloat(calculateAveragePercentage().replace(",", ".")) >= 90
                              ? "bg-green-500"
                              : "bg-purple-500"
                          }`}
                          style={{
                            width: `${Math.min(Number.parseFloat(calculateAveragePercentage().replace(",", ".")), 100)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span className="font-bold text-green-600">Meta: 90%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-6 h-6 text-slate-600" />
                      <h3 className="text-xl font-semibold text-gray-800">Porcentagem Trabalhada por Funcionário</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={getChartData()} margin={{ top: 30, right: 30, left: 0, bottom: 100 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#4b5563", fontSize: 13 }}
                          angle={-45}
                          textAnchor="end"
                          height={120}
                        />
                        <YAxis
                          tick={{ fill: "#4b5563", fontSize: 13 }}
                          label={{
                            value: "Porcentagem (%)",
                            angle: -90,
                            position: "insideLeft",
                            fill: "#4b5563",
                            offset: 10,
                          }}
                          domain={[0, 100]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                          <LabelList
                            dataKey="displayPercentage"
                            position="top"
                            fill="#1f2937"
                            fontSize={13}
                            fontWeight="bold"
                            formatter={(value) => `${value}%`}
                          />
                          {getChartData().map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.percentage >= 90
                                  ? "#10b981"
                                  : entry.percentage >= 70
                                    ? "#3b82f6"
                                    : entry.percentage >= 50
                                      ? "#f59e0b"
                                      : "#ef4444"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="flex gap-4 justify-center mt-4 text-sm flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500"></div>
                        <span className="text-gray-600">≥90%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-500"></div>
                        <span className="text-gray-600">70-89%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-500"></div>
                        <span className="text-gray-600">50-69%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500"></div>
                        <span className="text-gray-600">&lt;50%</span>
                      </div>
                    </div>

                    <div className="mt-6 bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 border-b-2 border-gray-200">
                        <h4 className="font-semibold text-gray-700">Detalhes por Funcionário</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
                        {getChartData().map((emp, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-700 text-sm">{emp.name}</span>
                              <div
                                className="px-2 py-1 rounded font-bold text-sm"
                                style={{
                                  backgroundColor:
                                    emp.percentage >= 90
                                      ? "#dcfce7"
                                      : emp.percentage >= 70
                                        ? "#dbeafe"
                                        : emp.percentage >= 50
                                          ? "#fef3c7"
                                          : "#fee2e2",
                                  color:
                                    emp.percentage >= 90
                                      ? "#166534"
                                      : emp.percentage >= 70
                                        ? "#1e40af"
                                        : emp.percentage >= 50
                                          ? "#92400e"
                                          : "#991b1b",
                                }}
                              >
                                {emp.displayPercentage}%
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Meta: {emp.goal}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Como usar:</strong> Selecione a data do apontamento acima. Cada funcionário tem sua meta
                  diária pré-definida (Raposo, Mika e Luiz: 8:30h | Schutz, Caio e Thiago: 6:00h). Insira as horas
                  trabalhadas e clique em "Salvar" para registrar ou atualizar. Use "Ver Histórico" para consultar
                  registros anteriores.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-700">Média Semanal (7 dias)</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{calculateWeeklyAverage()}%</p>
                  <p className="text-sm text-gray-600 mt-1">{getWeekData().length} dias registrados</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-700">Média Mensal</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">{calculateMonthlyAverage()}%</p>
                  <p className="text-sm text-gray-600 mt-1">{getMonthData().length} dias registrados</p>
                </div>
              </div>

              {getWeekData().length > 0 && (
                <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Evolução dos Últimos 7 Dias</h3>
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
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ fill: "#6366f1", r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                <div className="bg-gray-100 px-6 py-3 border-b-2 border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Histórico de Dias Trabalhados</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {history.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      Nenhum dia registrado ainda. Salve o primeiro dia para começar o histórico!
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                              Média
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                              Tempo Médio
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                              Meta
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                              Ação
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {history.map((day) => (
                            <tr key={day.date} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-800">{formatDate(day.date)}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-lg font-bold text-indigo-600">
                                  {day.averagePercentage.toFixed(1).replace(".", ",")}%
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center text-sm text-gray-700 font-semibold">
                                {day.averageTime}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {day.averagePercentage >= 90 ? (
                                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                    ✓ Atingida
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                    Faltou {(90 - day.averagePercentage).toFixed(1)}%
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => loadHistoricalDay(day.date)}
                                  className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 text-xs font-semibold"
                                >
                                  ✏️ Editar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={exportToExcel}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                📊 Exportar para CSV
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
