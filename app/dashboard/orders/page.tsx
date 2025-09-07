"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coffee, ShoppingCart, Building2, MapPin, Package, Users, Plus, Loader2, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { API_ENDPOINTS } from "@/lib/config"

interface Order {
  id: number
  order_id: string
  user_id: number
  username: string
  filial_id: number
  filial_name: string
  items: Array<{
    product_id: number
    name: string
    count: number
    subtotal: number
  }>
  total: number
  status: string
  created: string
  updated: string
}

interface Product {
  id: number
  name: string
  category_id: number
  category_name?: string
  filials: number[]
}

interface Branch {
  id: number
  name: string
  location: string
}

interface AdminUser {
  id: number
  name: string
  phone: string
  is_admin: boolean
  filial?: {
    id: number
    name: string
    location: string
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [newOrder, setNewOrder] = useState({
    username: "",
    filial: "",
    items: [] as Array<{ product_id: number; count: number }>,
  })
  const [selectedProducts, setSelectedProducts] = useState<{ [key: number]: number }>({})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const router = useRouter()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Building2, current: false },
    { name: "Filiallar", href: "/dashboard/branches", icon: MapPin, current: false },
    { name: "Kategoriyalar", href: "/dashboard/categories", icon: Package, current: false },
    { name: "Mahsulotlar", href: "/dashboard/products", icon: Coffee, current: false },
    { name: "Foydalanuvchilar", href: "/dashboard/users", icon: Users, current: false },
    { name: "Buyurtmalar", href: "/dashboard/orders", icon: ShoppingCart, current: true },
  ]

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    setCurrentUser(JSON.parse(userData))
    fetchData(token)

    // Har 10 soniyada ma'lumotlarni yangilash
    const interval = setInterval(() => {
      if (token) {
        fetchData(token)
      }
    }, 10000) // 10 soniya

    // Cleanup function - komponent unmount bo'lganda interval ni tozalash
    return () => {
      clearInterval(interval)
    }
  }, [router])

  const fetchData = async (token: string) => {
    try {
      // Faqat buyurtmalarni yangilash, mahsulotlar va filiallar o'zgarmasligi uchun
      const ordersRes = await fetch(API_ENDPOINTS.orderslist, { 
        headers: { Authorization: `Bearer ${token}` } 
      })

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(Array.isArray(ordersData.data) ? ordersData.data : [])
      }

      // Mahsulotlar va filiallar faqat birinchi marta yuklansin
      if (products.length === 0 || branches.length === 0) {
        const [productsRes, branchesRes] = await Promise.all([
          fetch(API_ENDPOINTS.products, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(API_ENDPOINTS.filials, { headers: { Authorization: `Bearer ${token}` } }),
        ])

        if (productsRes.ok) {
          const productsData = await productsRes.json()
          const productsArray = productsData.data || productsData || []
          setProducts(Array.isArray(productsArray) ? productsArray : [])
        }

        if (branchesRes.ok) {
          const branchesData = await branchesRes.json()
          setBranches(Array.isArray(branchesData.data) ? branchesData.data : [])
        }
      }
    } catch (error) {
      console.error("Data fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Order ID dan sana olish funksiyasi
  const getDateFromOrderId = (orderId: string) => {
    if (!orderId || orderId.length < 8) return null
    
    try {
      const parts = orderId.split('-')
      if (parts.length >= 3) {
        const year = parseInt(`20${parts[0]}`) // 25 -> 2025
        const month = parseInt(parts[1]) - 1 // JavaScript da oylar 0 dan boshlanadi
        const day = parseInt(parts[2])
        
        return new Date(year, month, day)
      }
    } catch (error) {
      console.error('Order ID dan sana olishda xatolik:', error)
    }
    
    return null
  }

  // Sana filtri uchun funksiya
  const isInDateRange = (orderDate: Date, filterType: string) => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    switch (filterType) {
      case "today":
        const orderStart = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate())
        return orderStart.getTime() === todayStart.getTime()
      
      case "week":
        const weekAgo = new Date(todayStart)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return orderDate >= weekAgo && orderDate <= today
      
      case "month":
        const monthAgo = new Date(todayStart)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return orderDate >= monthAgo && orderDate <= today
      
      default:
        return true
    }
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingOrder(true)
    setError("")
    setSuccess("")

    const token = localStorage.getItem("token")
    if (!token) return

    const items = Object.entries(selectedProducts)
      .filter(([_, count]) => count > 0)
      .map(([productId, count]) => ({
        product_id: Number.parseInt(productId),
        count,
      }))

    if (items.length === 0) {
      setError("Kamida bitta mahsulot tanlang")
      setIsCreatingOrder(false)
      return
    }

    try {
      const response = await fetch(API_ENDPOINTS.orders, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newOrder.username,
          filial: newOrder.filial,
          items,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setOrders([data.data, ...orders])
        setNewOrder({ username: "", filial: "", items: [] })
        setSelectedProducts({})
        setSuccess("Buyurtma muvaffaqiyatli yaratildi")
        setDialogOpen(false)
      } else {
        setError(data.message || "Xatolik yuz berdi")
      }
    } catch (error) {
      setError("Tarmoq xatosi")
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const handleProductCountChange = (productId: number, count: number) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: Math.max(0, count),
    }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent_to_printer":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            Yuborildi
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white">
            Tugallandi
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
            Bekor qilindi
          </Badge>
        )
      case "print_error":
        return (
          <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">
            Print xatosi
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredOrders = orders.filter((order) => {
    // Status filtrini tekshirish
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false
    }
    
    // Sana filtrini tekshirish
    if (dateFilter !== "all") {
      const orderDate = getDateFromOrderId(order.order_id)
      if (!orderDate || !isInDateRange(orderDate, dateFilter)) {
        return false
      }
    }
    
    return true
  })

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Coffee className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">Restoran boshqaruvi</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  item.current
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </a>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">{currentUser?.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser?.phone}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={handleLogout}>
              Chiqish
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 bg-background border-b border-border px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Buyurtmalar</h1>
                <p className="text-muted-foreground">Restoran buyurtmalari boshqaruvi</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser?.is_admin && <Badge variant="secondary">Admin</Badge>}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Yangi buyurtma
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Yangi buyurtma yaratish</DialogTitle>
                    <DialogDescription>Mijoz uchun yangi buyurtma yarating</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrder} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Mijoz ismi</Label>
                        <Input
                          id="username"
                          placeholder="Mijoz ismini kiriting"
                          value={newOrder.username}
                          onChange={(e) => setNewOrder({ ...newOrder, username: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="filial">Filial</Label>
                        <Select
                          value={newOrder.filial}
                          onValueChange={(value) => setNewOrder({ ...newOrder, filial: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Filialni tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.name}>
                                {branch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Mahsulotlar</Label>
                      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                        {/* Mahsulotlar massivini tekshirish */}
                        {Array.isArray(products) && products.length > 0 ? (
                          products.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.category_name}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleProductCountChange(product.id, (selectedProducts[product.id] || 0) - 1)
                                  }
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center">{selectedProducts[product.id] || 0}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleProductCountChange(product.id, (selectedProducts[product.id] || 0) + 1)
                                  }
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted-foreground py-4">
                            Mahsulotlar yuklanmoqda yoki mavjud emas
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Bekor qilish
                      </Button>
                      <Button type="submit" disabled={isCreatingOrder}>
                        {isCreatingOrder ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Yaratilmoqda...
                          </>
                        ) : (
                          "Yaratish"
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <main className="p-4 lg:p-8">
          {success && (
            <Alert className="mb-6">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <div className="mb-6">
            <div className="flex items-center space-x-4 flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="status-filter">Status:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha statuslar</SelectItem>
                    <SelectItem value="sent_to_printer">Yuborilgan</SelectItem>
                    <SelectItem value="completed">Tugallangan</SelectItem>
                    <SelectItem value="cancelled">Bekor qilingan</SelectItem>
                    <SelectItem value="print_error">Print xatosi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="date-filter">Sana:</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha sanalar</SelectItem>
                    <SelectItem value="today">Bugun</SelectItem>
                    <SelectItem value="week">So'nggi hafta</SelectItem>
                    <SelectItem value="month">So'nggi oy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Natija haqida ma'lumot */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Jami: {filteredOrders.length} ta buyurtma</span>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Buyurtma #{order.id}</CardTitle>
                        <CardDescription className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <span>{order.username}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>{order.filial_name}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>{new Date(order.created).toLocaleString("uz-UZ")}</span>
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">{order.total.toLocaleString()} so'm</p>
                        <p className="text-sm text-muted-foreground">{order.items.length} ta mahsulot</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Buyurtma tarkibi:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{item.name}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {item.count}x
                            </Badge>
                            <span className="text-sm font-medium">{item.subtotal.toLocaleString()} so'm</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Buyurtmalar topilmadi</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {statusFilter === "all" && dateFilter === "all"
                    ? "Hozircha hech qanday buyurtma yo'q."
                    : "Tanlangan filtrlar bo'yicha buyurtmalar topilmadi."}
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Birinchi buyurtmani yaratish
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}