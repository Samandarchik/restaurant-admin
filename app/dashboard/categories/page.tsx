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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { API_ENDPOINTS, apiCall } from "@/lib/config"

interface Category {
  id: number
  name: string
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const router = useRouter()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Building2, current: false },
    { name: "Filiallar", href: "/dashboard/branches", icon: MapPin, current: false },
    { name: "Kategoriyalar", href: "/dashboard/categories", icon: Package, current: true },
    { name: "Mahsulotlar", href: "/dashboard/products", icon: Coffee, current: false },
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
    fetchCategories()
  }, [router])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown !== null) {
        const target = event.target as Element
        if (!target.closest('.dropdown-container')) {
          setActiveDropdown(null)
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [activeDropdown])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await apiCall(API_ENDPOINTS.categories)

      if (response.ok) {
        const data = await response.json()
        setCategories(data.data)
      }
    } catch (error) {
      console.error("Categories fetch error:", error)
      setError("Kategoriyalarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddingCategory(true)
    setError("")
    setSuccess("")

    try {
      const response = await apiCall(API_ENDPOINTS.categories, {
        method: "POST",
        body: JSON.stringify({ name: newCategoryName }),
      })

      const data = await response.json()

      if (data.success) {
        setCategories([...categories, data.data])
        setNewCategoryName("")
        setSuccess("Kategoriya muvaffaqiyatli qo'shildi")
        setDialogOpen(false)
      } else {
        setError(data.message || "Xatolik yuz berdi")
      }
    } catch (error) {
      setError("Tarmoq xatosi")
    } finally {
      setIsAddingCategory(false)
    }
  }

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    setIsEditingCategory(true)
    setError("")
    setSuccess("")

    try {
      const response = await apiCall(API_ENDPOINTS.category(editingCategory.id), {
        method: "PUT",
        body: JSON.stringify({ name: editCategoryName }),
      })

      const data = await response.json()

      if (data.success) {
        setCategories(
          categories.map((cat) => (cat.id === editingCategory.id ? { ...cat, name: editCategoryName } : cat)),
        )
        setSuccess("Kategoriya muvaffaqiyatli yangilandi")
        setEditDialogOpen(false)
        setEditingCategory(null)
        setEditCategoryName("")
        setActiveDropdown(null)
      } else {
        setError(data.message || "Xatolik yuz berdi")
      }
    } catch (error) {
      setError("Tarmoq xatosi")
    } finally {
      setIsEditingCategory(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return

    setIsDeletingCategory(true)
    setError("")

    try {
      const response = await apiCall(API_ENDPOINTS.category(deletingCategory.id), {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setCategories(categories.filter((cat) => cat.id !== deletingCategory.id))
        setSuccess("Kategoriya muvaffaqiyatli o'chirildi")
        setDeleteDialogOpen(false)
        setDeletingCategory(null)
        setActiveDropdown(null)
      } else {
        setError(data.message || "Xatolik yuz berdi")
      }
    } catch (error) {
      setError("Tarmoq xatosi")
    } finally {
      setIsDeletingCategory(false)
    }
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setEditCategoryName(category.name)
    setEditDialogOpen(true)
    setActiveDropdown(null)
  }

  const openDeleteDialog = (category: Category) => {
    setDeletingCategory(category)
    setDeleteDialogOpen(true)
    setActiveDropdown(null)
  }

  const toggleDropdown = (categoryId: number) => {
    setActiveDropdown(activeDropdown === categoryId ? null : categoryId)
  }

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

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 bg-background border-b border-border px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Kategoriyalar</h1>
                <p className="text-muted-foreground">Mahsulot kategoriyalari boshqaruvi</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user?.is_admin && <Badge variant="secondary">Admin</Badge>}
              {user?.is_admin && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Yangi kategoriya
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yangi kategoriya qo'shish</DialogTitle>
                      <DialogDescription>Yangi kategoriya nomini kiriting</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="name">Kategoriya nomi</Label>
                        <Input
                          id="name"
                          placeholder="Masalan: Issiq ichimliklar"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          Bekor qilish
                        </Button>
                        <Button type="submit" disabled={isAddingCategory}>
                          {isAddingCategory ? (
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

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>ID: {category.id}</CardDescription>
                      </div>
                    </div>
                    {user?.is_admin && (
                      <div className="relative dropdown-container">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleDropdown(category.id)}
                          className="p-1 hover:bg-accent"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        
                        {/* Custom Dropdown Menu */}
                        {activeDropdown === category.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-50">
                            <div className="py-1">
                              <Button
                                variant="ghost"
                                className="w-full justify-start text-left h-auto py-2 px-4 text-sm hover:bg-accent hover:text-accent-foreground"
                                onClick={() => openEditDialog(category)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Tahrirlash
                              </Button>
                              <Button
                                variant="ghost"
                                className="w-full justify-start text-left h-auto py-2 px-4 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => openDeleteDialog(category)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                O'chirish
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Faol
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {categories.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Kategoriyalar topilmadi</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Hozircha hech qanday kategoriya qo'shilmagan. Yangi kategoriya qo'shish uchun yuqoridagi tugmani
                  bosing.
                </p>
                {user?.is_admin && (
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Birinchi kategoriyani qo'shish
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategoriyani tahrirlash</DialogTitle>
            <DialogDescription>Kategoriya nomini o'zgartiring</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCategory} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="editName">Kategoriya nomi</Label>
              <Input
                id="editName"
                placeholder="Masalan: Issiq ichimliklar"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={isEditingCategory}>
                {isEditingCategory ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  "Saqlash"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategoriyani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham "{deletingCategory?.name}" kategoriyasini o'chirmoqchimisiz? Bu amalni bekor qilib
              bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isDeletingCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingCategory ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  O'chirilmoqda...
                </>
              ) : (
                "O'chirish"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}