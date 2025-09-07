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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Coffee,
  Package,
  Plus,
  Building2,
  MapPin,
  Users,
  ShoppingCart,
  Loader2,
  Menu,
  Search,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { API_ENDPOINTS } from "@/lib/config"

interface Product {
  id: number
  name: string
  category_id: number
  category_name?: string
  filials: number[]
  filial_names?: string[]
}

interface Category {
  id: number
  name: string
}

interface Branch {
  id: number
  name: string
  location: string
}

interface User {
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [isDeletingProduct, setIsDeletingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "",
    filials: [] as number[],
  })
  const [editProduct, setEditProduct] = useState({
    name: "",
    category_id: "",
    filials: [] as number[],
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Building2, current: false },
    { name: "Filiallar", href: "/dashboard/branches", icon: MapPin, current: false },
    { name: "Kategoriyalar", href: "/dashboard/categories", icon: Package, current: false },
    { name: "Mahsulotlar", href: "/dashboard/products", icon: Coffee, current: true },
    { name: "Foydalanuvchilar", href: "/dashboard/users", icon: Users, current: false },
    { name: "Buyurtmalar", href: "/dashboard/orders", icon: ShoppingCart, current: false },
  ]

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    setUser(JSON.parse(userData))
    fetchData(token)
  }, [router])

  const fetchData = async (token: string) => {
    try {
      const [productsRes, categoriesRes, branchesRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.products}/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API_ENDPOINTS.categories, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API_ENDPOINTS.filials, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        if (productsData.success && productsData.data) {
          setProducts(productsData.data || [])
        } else {
          setProducts([])
        }
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData.data || [])
      }

      if (branchesRes.ok) {
        const branchesData = await branchesRes.json()
        setBranches(branchesData.data || [])
      }
    } catch (error) {
      console.error("Data fetch error:", error)
      setProducts([])
      setCategories([])
      setBranches([])
    } finally {
      setLoading(false)
    }
  }

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token")
    if (!token) throw new Error("No token")

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message || "API error")
    }
    return data
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddingProduct(true)
    setError("")
    setSuccess("")

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch(API_ENDPOINTS.products, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProduct.name,
          category_id: Number.parseInt(newProduct.category_id),
          filials: newProduct.filials,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const categoryName = categories.find((c) => c.id === Number.parseInt(newProduct.category_id))?.name
        setProducts([...products, { ...data.data, category_name: categoryName }])
        setNewProduct({ name: "", category_id: "", filials: [] })
        setSuccess("Mahsulot muvaffaqiyatli qo'shildi")
        setDialogOpen(false)
      } else {
        setError(data.message || "Xatolik yuz berdi")
      }
    } catch (error) {
      setError("Tarmoq xatosi")
    } finally {
      setIsAddingProduct(false)
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    setIsEditingProduct(true)
    setError("")
    setSuccess("")

    try {
      const data = await apiCall(`${API_ENDPOINTS.products}/${editingProduct.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editProduct.name,
          category_id: Number.parseInt(editProduct.category_id),
          filials: editProduct.filials,
        }),
      })

      const categoryName = categories.find((c) => c.id === Number.parseInt(editProduct.category_id))?.name
      const updatedProduct = { ...data.data, category_name: categoryName }

      setProducts(products.map((p) => (p.id === editingProduct.id ? updatedProduct : p)))
      setSuccess("Mahsulot muvaffaqiyatli yangilandi")
      setEditDialogOpen(false)
      setEditingProduct(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Xatolik yuz berdi")
    } finally {
      setIsEditingProduct(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return

    setIsDeletingProduct(true)
    setError("")

    try {
      await apiCall(`${API_ENDPOINTS.products}/${deletingProduct.id}`, {
        method: "DELETE",
      })

      setProducts(products.filter((p) => p.id !== deletingProduct.id))
      setSuccess("Mahsulot muvaffaqiyatli o'chirildi")
      setDeleteDialogOpen(false)
      setDeletingProduct(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Xatolik yuz berdi")
    } finally {
      setIsDeletingProduct(false)
    }
  }

  const handleBranchToggle = (branchId: number) => {
    setNewProduct((prev) => ({
      ...prev,
      filials: prev.filials.includes(branchId)
        ? prev.filials.filter((id) => id !== branchId)
        : [...prev.filials, branchId],
    }))
  }

  const handleEditBranchToggle = (branchId: number) => {
    setEditProduct((prev) => ({
      ...prev,
      filials: prev.filials.includes(branchId)
        ? prev.filials.filter((id) => id !== branchId)
        : [...prev.filials, branchId],
    }))
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase()
    return (
      product.name.toLowerCase().includes(query) ||
      product.category_name?.toLowerCase().includes(query) ||
      product.filial_names?.some((name) => name.toLowerCase().includes(query))
    )
  })

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setEditProduct({
      name: product.name,
      category_id: product.category_id.toString(),
      filials: product.filials,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (product: Product) => {
    setDeletingProduct(product)
    setDeleteDialogOpen(true)
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
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

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
                <span className="text-sm font-medium text-primary-foreground">{user?.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.phone}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={handleLogout}>
              Chiqish
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 bg-background border-b border-border px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Mahsulotlar</h1>
                <p className="text-muted-foreground">Restoran mahsulotlari boshqaruvi</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user?.is_admin && <Badge variant="secondary">Admin</Badge>}
              {user?.is_admin && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Yangi mahsulot
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Yangi mahsulot qo'shish</DialogTitle>
                      <DialogDescription>Yangi mahsulot ma'lumotlarini kiriting</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="name">Mahsulot nomi</Label>
                        <Input
                          id="name"
                          placeholder="Masalan: Amerikano"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Kategoriya</Label>
                        <Select
                          value={newProduct.category_id}
                          onValueChange={(value) => setNewProduct({ ...newProduct, category_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Kategoriyani tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Filiallar</Label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {branches.map((branch) => (
                            <div key={branch.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`branch-${branch.id}`}
                                checked={newProduct.filials.includes(branch.id)}
                                onCheckedChange={() => handleBranchToggle(branch.id)}
                              />
                              <Label htmlFor={`branch-${branch.id}`} className="text-sm">
                                {branch.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          Bekor qilish
                        </Button>
                        <Button type="submit" disabled={isAddingProduct}>
                          {isAddingProduct ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Qo'shilmoqda...
                            </>
                          ) : (
                            "Qo'shish"
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        <main className="p-4 lg:p-8">
          {success && (
            <Alert className="mb-6">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Mahsulot, kategoriya yoki filial bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                {filteredProducts.length} ta mahsulot topildi "{searchQuery}" so'rovi bo'yicha
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Coffee className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription>
                          {product.category_name || `Kategoriya ID: ${product.category_id}`}
                        </CardDescription>
                      </div>
                    </div>
                    {user?.is_admin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Tahrirlash
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(product)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            O'chirish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Filiallar:</span>
                      <Badge variant="outline">{product.filials.length} ta</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {product.filial_names?.slice(0, 2).map((filialName, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {filialName}
                        </Badge>
                      )) ||
                        product.filials.slice(0, 2).map((filialId) => {
                          const branch = branches.find((b) => b.id === filialId)
                          return (
                            <Badge key={filialId} variant="secondary" className="text-xs">
                              {branch?.name || `ID: ${filialId}`}
                            </Badge>
                          )
                        })}
                      {product.filials.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{product.filials.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Coffee className="h-12 w-12 text-muted-foreground mb-4" />
                {searchQuery ? (
                  <>
                    <h3 className="text-lg font-medium mb-2">Qidiruv natijalari topilmadi</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      "{searchQuery}" so'rovi bo'yicha hech qanday mahsulot topilmadi. Boshqa kalit so'z bilan qidiring.
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Barcha mahsulotlarni ko'rsatish
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium mb-2">Mahsulotlar topilmadi</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Hozircha hech qanday mahsulot qo'shilmagan. Yangi mahsulot qo'shish uchun yuqoridagi tugmani
                      bosing.
                    </p>
                    {user?.is_admin && (
                      <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Birinchi mahsulotni qo'shish
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Mahsulotni tahrirlash</DialogTitle>
                <DialogDescription>Mahsulot ma'lumotlarini yangilang</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditProduct} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="edit-name">Mahsulot nomi</Label>
                  <Input
                    id="edit-name"
                    placeholder="Masalan: Amerikano"
                    value={editProduct.name}
                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category">Kategoriya</Label>
                  <Select
                    value={editProduct.category_id}
                    onValueChange={(value) => setEditProduct({ ...editProduct, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategoriyani tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Filiallar</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {branches.map((branch) => (
                      <div key={branch.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-branch-${branch.id}`}
                          checked={editProduct.filials.includes(branch.id)}
                          onCheckedChange={() => handleEditBranchToggle(branch.id)}
                        />
                        <Label htmlFor={`edit-branch-${branch.id}`} className="text-sm">
                          {branch.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Bekor qilish
                  </Button>
                  <Button type="submit" disabled={isEditingProduct}>
                    {isEditingProduct ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Yangilanmoqda...
                      </>
                    ) : (
                      "Yangilash"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Mahsulotni o'chirish</DialogTitle>
                <DialogDescription>
                  Haqiqatan ham "{deletingProduct?.name}" mahsulotini o'chirmoqchimisiz? Bu amalni bekor qilib
                  bo'lmaydi.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Bekor qilish
                </Button>
                <Button variant="destructive" onClick={handleDeleteProduct} disabled={isDeletingProduct}>
                  {isDeletingProduct ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      O'chirilmoqda...
                    </>
                  ) : (
                    "O'chirish"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
