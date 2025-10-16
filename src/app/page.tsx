'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  PlusCircle, 
  Filter,
  Calendar as CalendarIcon,
  Eye,
  EyeOff,
  LogOut,
  Settings,
  Target,
  Zap,
  Trash2,
  Users,
  UserPlus,
  Shield,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

// Tipos de dados
interface Transaction {
  id: string
  type: 'entrada' | 'saida' | 'aporte'
  category: string
  description: string
  amount: number
  date: Date
  paymentMethod: string
  platform?: string
  isAdvertising?: boolean
  userId: string
  userName: string
}

interface User {
  id: string
  email: string
  password: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  createdAt: Date
  invitedBy?: string
}

interface Category {
  id: string
  name: string
  type: 'entrada' | 'saida' | 'aporte'
}

interface PaymentMethod {
  id: string
  name: string
}

interface Invitation {
  id: string
  email: string
  role: 'admin' | 'user' | 'viewer'
  invitedBy: string
  createdAt: Date
  status: 'pending' | 'accepted' | 'expired'
}

interface Task {
  id: string
  title: string
  description: string
  assignedTo: string
  assignedToName: string
  dueDate: Date
  status: 'pending' | 'in-progress' | 'completed'
  createdBy: string
  createdByName: string
  createdAt: Date
}

export default function FinancialDashboard() {
  // Estado para controlar se o componente foi montado no cliente
  const [isMounted, setIsMounted] = useState(false)

  // Estados de autenticação
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', confirmPassword: '', name: '' })
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'user' as 'admin' | 'user' | 'viewer' })
  const [showPassword, setShowPassword] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  // Estados principais
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Vendas', type: 'entrada' },
    { id: '2', name: 'Serviços', type: 'entrada' },
    { id: '3', name: 'Anúncios Google', type: 'saida' },
    { id: '4', name: 'Anúncios Facebook', type: 'saida' },
    { id: '5', name: 'Ferramentas', type: 'saida' },
    { id: '6', name: 'Salários', type: 'saida' },
    { id: '7', name: 'Investimento Inicial', type: 'aporte' },
  ])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', name: 'PIX' },
    { id: '2', name: 'Cartão de Crédito' },
    { id: '3', name: 'Cartão de Débito' },
    { id: '4', name: 'Transferência Bancária' },
    { id: '5', name: 'Dinheiro' },
  ])

  // Estados de formulário
  const [transactionForm, setTransactionForm] = useState({
    type: 'entrada' as 'entrada' | 'saida' | 'aporte',
    category: '',
    description: '',
    amount: '',
    date: new Date(),
    paymentMethod: '',
    platform: '',
    isAdvertising: false
  })

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: new Date()
  })

  // Estados de filtros
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    type: 'all' as 'all' | 'entrada' | 'saida' | 'aporte',
    category: 'all',
    platform: 'all',
    user: 'all'
  })

  const [taskFilters, setTaskFilters] = useState({
    status: 'all' as 'all' | 'pending' | 'in-progress' | 'completed',
    assignedTo: 'all'
  })

  // Estados de modais
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', type: 'entrada' as 'entrada' | 'saida' | 'aporte' })
  const [newPaymentMethod, setNewPaymentMethod] = useState('')

  // Contador para IDs únicos (evita Date.now() que causa hidratação)
  const [idCounter, setIdCounter] = useState(1)

  // Efeito para marcar que o componente foi montado no cliente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Carregar dados do localStorage apenas no cliente
  useEffect(() => {
    if (!isMounted) return

    const savedUsers = localStorage.getItem('financial-users')
    const savedTransactions = localStorage.getItem('financial-transactions')
    const savedTasks = localStorage.getItem('financial-tasks')
    const savedCategories = localStorage.getItem('financial-categories')
    const savedPaymentMethods = localStorage.getItem('financial-payment-methods')
    const savedInvitations = localStorage.getItem('financial-invitations')
    const savedAuth = localStorage.getItem('financial-auth')
    const savedCurrentUser = localStorage.getItem('financial-current-user')
    const savedIdCounter = localStorage.getItem('financial-id-counter')

    if (savedUsers) setUsers(JSON.parse(savedUsers))
    if (savedTransactions) {
      const parsed = JSON.parse(savedTransactions)
      setTransactions(parsed.map((t: any) => ({ ...t, date: new Date(t.date) })))
    }
    if (savedTasks) {
      const parsed = JSON.parse(savedTasks)
      setTasks(parsed.map((t: any) => ({ 
        ...t, 
        dueDate: new Date(t.dueDate),
        createdAt: new Date(t.createdAt)
      })))
    }
    if (savedCategories) setCategories(JSON.parse(savedCategories))
    if (savedPaymentMethods) setPaymentMethods(JSON.parse(savedPaymentMethods))
    if (savedInvitations) setInvitations(JSON.parse(savedInvitations))
    if (savedAuth && savedCurrentUser) {
      setIsLoggedIn(true)
      setCurrentUser(JSON.parse(savedCurrentUser))
    }
    if (savedIdCounter) setIdCounter(parseInt(savedIdCounter))
  }, [isMounted])

  // Salvar dados no localStorage apenas no cliente
  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem('financial-users', JSON.stringify(users))
  }, [users, isMounted])

  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem('financial-transactions', JSON.stringify(transactions))
  }, [transactions, isMounted])

  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem('financial-tasks', JSON.stringify(tasks))
  }, [tasks, isMounted])

  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem('financial-categories', JSON.stringify(categories))
  }, [categories, isMounted])

  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem('financial-payment-methods', JSON.stringify(paymentMethods))
  }, [paymentMethods, isMounted])

  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem('financial-invitations', JSON.stringify(invitations))
  }, [invitations, isMounted])

  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem('financial-id-counter', idCounter.toString())
  }, [idCounter, isMounted])

  useEffect(() => {
    if (!isMounted) return
    if (currentUser) {
      localStorage.setItem('financial-current-user', JSON.stringify(currentUser))
    }
  }, [currentUser, isMounted])

  // Função para gerar ID único
  const generateId = () => {
    const newId = idCounter
    setIdCounter(prev => prev + 1)
    return newId.toString()
  }

  // Funções de autenticação
  const handleLogin = () => {
    const user = users.find(u => u.email === loginForm.email && u.password === loginForm.password)
    if (user) {
      setIsLoggedIn(true)
      setCurrentUser(user)
      if (isMounted) {
        localStorage.setItem('financial-auth', 'true')
        localStorage.setItem('financial-current-user', JSON.stringify(user))
      }
      setLoginForm({ email: '', password: '' })
    } else {
      alert('Email ou senha incorretos!')
    }
  }

  const handleRegister = () => {
    if (registerForm.password !== registerForm.confirmPassword) {
      alert('Senhas não coincidem!')
      return
    }
    if (users.find(u => u.email === registerForm.email)) {
      alert('Email já cadastrado!')
      return
    }

    const newUser: User = {
      id: generateId(),
      email: registerForm.email,
      password: registerForm.password,
      name: registerForm.name,
      role: users.length === 0 ? 'admin' : 'user', // Primeiro usuário é admin
      createdAt: new Date()
    }

    setUsers([...users, newUser])
    setRegisterForm({ email: '', password: '', confirmPassword: '', name: '' })
    setIsRegistering(false)
    alert('Usuário cadastrado com sucesso!')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    if (isMounted) {
      localStorage.removeItem('financial-auth')
      localStorage.removeItem('financial-current-user')
    }
  }

  // Funções de convites
  const handleInviteUser = () => {
    if (!inviteForm.email || !currentUser) return

    if (users.find(u => u.email === inviteForm.email)) {
      alert('Este email já está cadastrado!')
      return
    }

    if (invitations.find(i => i.email === inviteForm.email && i.status === 'pending')) {
      alert('Já existe um convite pendente para este email!')
      return
    }

    const newInvitation: Invitation = {
      id: generateId(),
      email: inviteForm.email,
      role: inviteForm.role,
      invitedBy: currentUser.id,
      createdAt: new Date(),
      status: 'pending'
    }

    setInvitations([...invitations, newInvitation])
    setInviteForm({ email: '', role: 'user' })
    setShowInviteModal(false)
    alert(`Convite enviado para ${newInvitation.email}! (Simulado - em produção seria enviado por email)`)
  }

  const updateUserRole = (userId: string, newRole: 'admin' | 'user' | 'viewer') => {
    if (currentUser?.role !== 'admin') {
      alert('Apenas administradores podem alterar permissões!')
      return
    }

    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ))
  }

  // Funções de transações
  const addTransaction = () => {
    if (!transactionForm.category || !transactionForm.description || !transactionForm.amount || !transactionForm.paymentMethod || !currentUser) {
      alert('Preencha todos os campos obrigatórios!')
      return
    }

    const newTransaction: Transaction = {
      id: generateId(),
      type: transactionForm.type,
      category: transactionForm.category,
      description: transactionForm.description,
      amount: parseFloat(transactionForm.amount),
      date: transactionForm.date,
      paymentMethod: transactionForm.paymentMethod,
      platform: transactionForm.platform || undefined,
      isAdvertising: transactionForm.isAdvertising,
      userId: currentUser.id,
      userName: currentUser.name
    }

    setTransactions([...transactions, newTransaction])
    setTransactionForm({
      type: 'entrada',
      category: '',
      description: '',
      amount: '',
      date: new Date(),
      paymentMethod: '',
      platform: '',
      isAdvertising: false
    })
    setShowTransactionModal(false)
  }

  const deleteTransaction = (transactionId: string) => {
    if (!currentUser) return

    const transaction = transactions.find(t => t.id === transactionId)
    if (!transaction) return

    // Verificar permissões: admin pode deletar qualquer transação, usuários só suas próprias
    if (currentUser.role !== 'admin' && transaction.userId !== currentUser.id) {
      alert('Você só pode deletar suas próprias transações!')
      return
    }

    if (confirm('Tem certeza que deseja deletar esta transação?')) {
      setTransactions(transactions.filter(t => t.id !== transactionId))
    }
  }

  // Funções de tarefas
  const addTask = () => {
    if (!taskForm.title || !taskForm.assignedTo || !currentUser) {
      alert('Preencha todos os campos obrigatórios!')
      return
    }

    const assignedUser = users.find(u => u.id === taskForm.assignedTo)
    if (!assignedUser) {
      alert('Usuário não encontrado!')
      return
    }

    const newTask: Task = {
      id: generateId(),
      title: taskForm.title,
      description: taskForm.description,
      assignedTo: taskForm.assignedTo,
      assignedToName: assignedUser.name,
      dueDate: taskForm.dueDate,
      status: 'pending',
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date()
    }

    setTasks([...tasks, newTask])
    setTaskForm({
      title: '',
      description: '',
      assignedTo: '',
      dueDate: new Date()
    })
    setShowTaskModal(false)
  }

  const updateTaskStatus = (taskId: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
    if (!currentUser) return

    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Verificar permissões: admin pode alterar qualquer tarefa, usuários só suas próprias ou que foram atribuídas a eles
    if (currentUser.role !== 'admin' && task.assignedTo !== currentUser.id && task.createdBy !== currentUser.id) {
      alert('Você só pode alterar tarefas atribuídas a você ou criadas por você!')
      return
    }

    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ))
  }

  const deleteTask = (taskId: string) => {
    if (!currentUser) return

    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Verificar permissões: admin pode deletar qualquer tarefa, usuários só suas próprias
    if (currentUser.role !== 'admin' && task.createdBy !== currentUser.id) {
      alert('Você só pode deletar tarefas criadas por você!')
      return
    }

    if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
      setTasks(tasks.filter(t => t.id !== taskId))
    }
  }

  const addCategory = () => {
    if (!newCategory.name) return
    const category: Category = {
      id: generateId(),
      name: newCategory.name,
      type: newCategory.type
    }
    setCategories([...categories, category])
    setNewCategory({ name: '', type: 'entrada' })
    setShowCategoryModal(false)
  }

  const addPaymentMethod = () => {
    if (!newPaymentMethod) return
    const method: PaymentMethod = {
      id: generateId(),
      name: newPaymentMethod
    }
    setPaymentMethods([...paymentMethods, method])
    setNewPaymentMethod('')
    setShowPaymentModal(false)
  }

  // Filtrar transações
  const filteredTransactions = transactions.filter(transaction => {
    if (filters.type !== 'all' && transaction.type !== filters.type) return false
    if (filters.category !== 'all' && transaction.category !== filters.category) return false
    if (filters.platform !== 'all' && transaction.platform !== filters.platform) return false
    if (filters.user !== 'all' && transaction.userId !== filters.user) return false
    if (filters.startDate && transaction.date < filters.startDate) return false
    if (filters.endDate && transaction.date > filters.endDate) return false
    return true
  })

  // Filtrar tarefas
  const filteredTasks = tasks.filter(task => {
    if (taskFilters.status !== 'all' && task.status !== taskFilters.status) return false
    if (taskFilters.assignedTo !== 'all' && task.assignedTo !== taskFilters.assignedTo) return false
    return true
  })

  // Cálculos de métricas
  const totalEntradas = filteredTransactions
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalSaidas = filteredTransactions
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalAportes = filteredTransactions
    .filter(t => t.type === 'aporte')
    .reduce((sum, t) => sum + t.amount, 0)

  const saldoAtual = totalEntradas - totalSaidas + totalAportes
  const lucroLiquido = totalEntradas - totalSaidas

  // Gastos com anúncios
  const gastosAnuncios = filteredTransactions
    .filter(t => t.isAdvertising || t.category.includes('Anúncios'))
    .reduce((sum, t) => sum + t.amount, 0)

  // ROI e ROAS
  const roi = gastosAnuncios > 0 ? ((lucroLiquido / gastosAnuncios) * 100) : 0
  const roas = gastosAnuncios > 0 ? (totalEntradas / gastosAnuncios) : 0

  // Gastos por plataforma
  const gastosGoogle = filteredTransactions
    .filter(t => t.platform === 'Google' || t.category.includes('Google'))
    .reduce((sum, t) => sum + t.amount, 0)

  const gastosFacebook = filteredTransactions
    .filter(t => t.platform === 'Facebook' || t.category.includes('Facebook'))
    .reduce((sum, t) => sum + t.amount, 0)

  // Métricas de tarefas
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const pendingTasks = tasks.filter(t => t.status === 'pending').length
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length

  // Verificar permissões
  const canManageUsers = currentUser?.role === 'admin'
  const canAddTransactions = currentUser?.role === 'admin' || currentUser?.role === 'user'
  const canViewAllTransactions = currentUser?.role === 'admin'
  const canManageTasks = currentUser?.role === 'admin' || currentUser?.role === 'user'

  // Mostrar loading enquanto não montou no cliente
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              {isRegistering ? 'Criar Conta' : 'Login'}
            </CardTitle>
            <p className="text-gray-600">Sistema Financeiro - Marketing</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isRegistering ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nome Completo</Label>
                  <Input
                    id="register-name"
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                      placeholder="Sua senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                    placeholder="Confirme sua senha"
                  />
                </div>
                <Button onClick={handleRegister} className="w-full">
                  Criar Conta
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsRegistering(false)}
                  className="w-full"
                >
                  Já tenho conta
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      placeholder="Sua senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button onClick={handleLogin} className="w-full">
                  Entrar
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsRegistering(true)}
                  className="w-full"
                >
                  Criar nova conta
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Dashboard Financeiro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Olá, {currentUser?.name}</span>
                <Badge variant={
                  currentUser?.role === 'admin' ? 'default' : 
                  currentUser?.role === 'user' ? 'secondary' : 'outline'
                }>
                  {currentUser?.role === 'admin' ? 'Admin' : 
                   currentUser?.role === 'user' ? 'Usuário' : 'Visualizador'}
                </Badge>
              </div>
              {canManageUsers && (
                <Dialog open={showUsersModal} onOpenChange={setShowUsersModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Usuários
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Configurações</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Button onClick={() => setShowCategoryModal(true)} className="w-full">
                      Gerenciar Categorias
                    </Button>
                    <Button onClick={() => setShowPaymentModal(true)} className="w-full">
                      Gerenciar Formas de Pagamento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roi.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Return on Investment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROAS</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {roas.toFixed(2)}x
              </div>
              <p className="text-xs text-muted-foreground">Return on Ad Spend</p>
            </CardContent>
          </Card>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Entradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center">
                <TrendingDown className="h-5 w-5 mr-2" />
                Saídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-sm text-gray-600">
                  Google Ads: R$ {gastosGoogle.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600">
                  Facebook Ads: R$ {gastosFacebook.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Aportes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                R$ {totalAportes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principais */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <Label>Data Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.startDate ? format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.startDate || undefined}
                          onSelect={(date) => setFilters({...filters, startDate: date || null})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Data Fim</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.endDate ? format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.endDate || undefined}
                          onSelect={(date) => setFilters({...filters, endDate: date || null})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Tipo</Label>
                    <Select value={filters.type} onValueChange={(value: any) => setFilters({...filters, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="entrada">Entradas</SelectItem>
                        <SelectItem value="saida">Saídas</SelectItem>
                        <SelectItem value="aporte">Aportes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Categoria</Label>
                    <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Plataforma</Label>
                    <Select value={filters.platform} onValueChange={(value) => setFilters({...filters, platform: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="Google">Google</SelectItem>
                        <SelectItem value="Facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {canViewAllTransactions && (
                    <div>
                      <Label>Usuário</Label>
                      <Select value={filters.user} onValueChange={(value) => setFilters({...filters, user: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({
                      startDate: null,
                      endDate: null,
                      type: 'all',
                      category: 'all',
                      platform: 'all',
                      user: 'all'
                    })}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4">
              {canManageUsers && (
                <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Convidar Usuário
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
              
              {canAddTransactions && (
                <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Nova Transação
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTransactions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Nenhuma transação encontrada</p>
                  ) : (
                    filteredTransactions.map(transaction => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              transaction.type === 'entrada' ? 'default' : 
                              transaction.type === 'saida' ? 'destructive' : 'secondary'
                            }>
                              {transaction.type}
                            </Badge>
                            <span className="font-medium">{transaction.category}</span>
                            {transaction.platform && (
                              <Badge variant="outline">{transaction.platform}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                            <span>{format(transaction.date, 'dd/MM/yyyy', { locale: ptBR })}</span>
                            <span>{transaction.paymentMethod}</span>
                            <span>Por: {transaction.userName}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className={`text-lg font-bold ${
                            transaction.type === 'entrada' ? 'text-green-600' : 
                            transaction.type === 'saida' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {transaction.type === 'saida' ? '-' : '+'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          {(currentUser?.role === 'admin' || transaction.userId === currentUser?.id) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteTransaction(transaction.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            {/* Métricas de Tarefas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTasks}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{pendingTasks}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{overdueTasks}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros de Tarefas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    Filtros de Tarefas
                  </span>
                  {canManageTasks && (
                    <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
                      <DialogTrigger asChild>
                        <Button>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Nova Tarefa
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={taskFilters.status} onValueChange={(value: any) => setTaskFilters({...taskFilters, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in-progress">Em Andamento</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Responsável</Label>
                    <Select value={taskFilters.assignedTo} onValueChange={(value) => setTaskFilters({...taskFilters, assignedTo: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Tarefas */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Tarefas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTasks.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Nenhuma tarefa encontrada</p>
                  ) : (
                    filteredTasks.map(task => {
                      const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date()
                      return (
                        <div key={task.id} className={`p-4 border rounded-lg ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-medium">{task.title}</h3>
                                <Badge variant={
                                  task.status === 'completed' ? 'default' : 
                                  task.status === 'in-progress' ? 'secondary' : 'outline'
                                }>
                                  {task.status === 'completed' ? 'Concluída' : 
                                   task.status === 'in-progress' ? 'Em Andamento' : 'Pendente'}
                                </Badge>
                                {isOverdue && (
                                  <Badge variant="destructive">Atrasada</Badge>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              )}
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>Responsável: {task.assignedToName}</span>
                                <span>Prazo: {format(task.dueDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
                                <span>Criado por: {task.createdByName}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {(currentUser?.role === 'admin' || task.assignedTo === currentUser?.id || task.createdBy === currentUser?.id) && (
                                <>
                                  <Select 
                                    value={task.status} 
                                    onValueChange={(value: any) => updateTaskStatus(task.id, value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pendente</SelectItem>
                                      <SelectItem value="in-progress">Em Andamento</SelectItem>
                                      <SelectItem value="completed">Concluída</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {(currentUser?.role === 'admin' || task.createdBy === currentUser?.id) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => deleteTask(task.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.map(category => {
                      const categoryTotal = filteredTransactions
                        .filter(t => t.category === category.name)
                        .reduce((sum, t) => sum + t.amount, 0)
                      
                      if (categoryTotal === 0) return null
                      
                      return (
                        <div key={category.id} className="flex justify-between items-center">
                          <span className="text-sm">{category.name}</span>
                          <span className={`font-medium ${
                            category.type === 'entrada' ? 'text-green-600' : 
                            category.type === 'saida' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            R$ {categoryTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance de Anúncios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Investido em Anúncios</span>
                      <span className="font-bold text-red-600">
                        R$ {gastosAnuncios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>ROI dos Anúncios</span>
                      <span className={`font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {roi.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>ROAS</span>
                      <span className="font-bold text-blue-600">
                        {roas.toFixed(2)}x
                      </span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Google Ads</span>
                        <span className="text-sm font-medium">
                          R$ {gastosGoogle.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Facebook Ads</span>
                        <span className="text-sm font-medium">
                          R$ {gastosFacebook.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {canViewAllTransactions && (
                <Card>
                  <CardHeader>
                    <CardTitle>Atividade por Usuário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {users.map(user => {
                        const userTransactions = filteredTransactions.filter(t => t.userId === user.id)
                        const userTotal = userTransactions.reduce((sum, t) => 
                          t.type === 'entrada' ? sum + t.amount : 
                          t.type === 'aporte' ? sum + t.amount : sum - t.amount, 0
                        )
                        
                        if (userTransactions.length === 0) return null
                        
                        return (
                          <div key={user.id} className="flex justify-between items-center">
                            <div>
                              <span className="text-sm font-medium">{user.name}</span>
                              <div className="text-xs text-gray-500">
                                {userTransactions.length} transações
                              </div>
                            </div>
                            <span className={`font-medium ${userTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              R$ {userTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Produtividade da Equipe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.map(user => {
                      const userTasks = tasks.filter(t => t.assignedTo === user.id)
                      const completedUserTasks = userTasks.filter(t => t.status === 'completed').length
                      const completionRate = userTasks.length > 0 ? (completedUserTasks / userTasks.length) * 100 : 0
                      
                      if (userTasks.length === 0) return null
                      
                      return (
                        <div key={user.id} className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium">{user.name}</span>
                            <div className="text-xs text-gray-500">
                              {completedUserTasks}/{userTasks.length} tarefas concluídas
                            </div>
                          </div>
                          <span className={`font-medium ${
                            completionRate >= 80 ? 'text-green-600' : 
                            completionRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {completionRate.toFixed(0)}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de Transação */}
        <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Transação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo</Label>
                <Select value={transactionForm.type} onValueChange={(value: any) => setTransactionForm({...transactionForm, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="aporte">Aporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Categoria</Label>
                <Select value={transactionForm.category} onValueChange={(value) => setTransactionForm({...transactionForm, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(cat => cat.type === transactionForm.type).map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                  placeholder="Descreva a transação..."
                />
              </div>

              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                  placeholder="0,00"
                />
              </div>

              <div>
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(transactionForm.date, 'dd/MM/yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={transactionForm.date}
                      onSelect={(date) => setTransactionForm({...transactionForm, date: date || new Date()})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={transactionForm.paymentMethod} onValueChange={(value) => setTransactionForm({...transactionForm, paymentMethod: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.id} value={method.name}>{method.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {transactionForm.type === 'saida' && (
                <div>
                  <Label>Plataforma (Anúncios)</Label>
                  <Select value={transactionForm.platform} onValueChange={(value) => setTransactionForm({...transactionForm, platform: value, isAdvertising: value !== ''})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Não é anúncio</SelectItem>
                      <SelectItem value="Google">Google Ads</SelectItem>
                      <SelectItem value="Facebook">Facebook Ads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button onClick={addTransaction} className="w-full">
                Adicionar Transação
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Tarefa */}
        <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título da Tarefa</Label>
                <Input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  placeholder="Ex: Criar campanha no Facebook"
                />
              </div>

              <div>
                <Label>Descrição (Opcional)</Label>
                <Textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Descreva os detalhes da tarefa..."
                />
              </div>

              <div>
                <Label>Responsável</Label>
                <Select value={taskForm.assignedTo} onValueChange={(value) => setTaskForm({...taskForm, assignedTo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prazo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(taskForm.dueDate, 'dd/MM/yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={taskForm.dueDate}
                      onSelect={(date) => setTaskForm({...taskForm, dueDate: date || new Date()})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button onClick={addTask} className="w-full">
                Adicionar Tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Convite */}
        <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Convidar Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                  placeholder="usuario@email.com"
                />
              </div>
              <div>
                <Label>Permissão</Label>
                <Select value={inviteForm.role} onValueChange={(value: any) => setInviteForm({...inviteForm, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Administrador - Acesso total</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Usuário - Pode adicionar transações</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>Visualizador - Apenas leitura</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInviteUser} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Enviar Convite
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Usuários */}
        <Dialog open={showUsersModal} onOpenChange={setShowUsersModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gerenciar Usuários</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Convidar Usuário
                </Button>
              </div>
              
              <div>
                <h4 className="font-medium mb-4">Usuários Ativos</h4>
                <div className="space-y-3">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">
                          Criado em {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select 
                          value={user.role} 
                          onValueChange={(value: any) => updateUserRole(user.id, value)}
                          disabled={user.id === currentUser?.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="viewer">Visualizador</SelectItem>
                          </SelectContent>
                        </Select>
                        {user.id === currentUser?.id && (
                          <Badge variant="outline">Você</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {invitations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-4">Convites Pendentes</h4>
                  <div className="space-y-3">
                    {invitations.filter(inv => inv.status === 'pending').map(invitation => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                        <div>
                          <div className="font-medium">{invitation.email}</div>
                          <div className="text-sm text-gray-500">
                            Convidado em {format(new Date(invitation.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        </div>
                        <Badge variant="outline">{invitation.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modais de Configuração */}
        <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerenciar Categorias</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Categoria</Label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    placeholder="Ex: Vendas Online"
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={newCategory.type} onValueChange={(value: any) => setNewCategory({...newCategory, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                      <SelectItem value="aporte">Aporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={addCategory} className="w-full">
                Adicionar Categoria
              </Button>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Categorias Existentes</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {categories.map(category => (
                    <div key={category.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{category.name}</span>
                      <Badge variant={
                        category.type === 'entrada' ? 'default' : 
                        category.type === 'saida' ? 'destructive' : 'secondary'
                      }>
                        {category.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerenciar Formas de Pagamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nova Forma de Pagamento</Label>
                <Input
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  placeholder="Ex: Boleto Bancário"
                />
              </div>
              <Button onClick={addPaymentMethod} className="w-full">
                Adicionar Forma de Pagamento
              </Button>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Formas Existentes</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {paymentMethods.map(method => (
                    <div key={method.id} className="p-2 bg-gray-50 rounded">
                      {method.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}