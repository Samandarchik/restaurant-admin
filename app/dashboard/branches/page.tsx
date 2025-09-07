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
import { Coffee, MapPin, Plus, Building2, Loader2, Menu, Edit, Trash2, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { API_ENDPOINTS } from "@/lib/config"

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

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddingBranch, setIsAddingBranch] = useState(false)
  const [newBranch, setNewBranch] = useState({ name: "", location: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const router = useRouter()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Building2, current: false },
    { name: "Filiallar", href: "/dashboard/branches", icon: MapPin, current: true },
    { name: "Kategoriyalar", href: "/dashboard/categories", icon: Coffee, current: false },
    { name: "Mahsulotlar", href: "/dashboard/products", icon: Coffee, current: false },
    { name: "Foydalanuvchilar", href: "/dashboard/users", icon: Coffee, current: false },
    { name: "Buyurtmalar", href: "/dashboard/orders", icon: Coffee, current: false },
  ]

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    setUser(JSON.parse(userData))
    fetchBranches(token)
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

  const fetchBranches = async (token: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.filials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBranches(data.data)
      }
    } catch (error) {
      console.error("Branches fetch error:", error)
      setError("Filiallarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddingBranch(true)
    setError("")
    setSuccess("")

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch(API_ENDPOINTS.filials, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newBranch),
      })

      const data = await response.json()

      if (data.success) {
        setBranches([...branches, data.data])
        setNewBranch({ name: "", location: "" })
        setSuccess("Filial muvaffaqiyatli qo'shildi")
        setDialogOpen(false)
      } else {
        setError(data.message || "Xatolik yuz berdi")
      }
    } catch (error) {
      setError("Tarmoq xatosi")
    } finally {
      setIsAddingBranch(false)
    }
  }

  const handleEditBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBranch) return

    setIsUpdating(true)
    setError("")
    setSuccess("")

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch(API_ENDPOINTS.filial(editingBranch.id), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingBranch.name,
          location: editingBranch.location,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setBranches(branches.map((branch) => (branch.id === editingBranch.id ? data.data : branch)))
        setSuccess("Filial muvaffaqiyatli yangilandi")
        setEditDialogOpen(false)
        setEditingBranch(null)
        setActiveDropdown(null)
      } else {
        setError(data.message || "Xatolik yuz berdi")
      }
    } catch (error) {
      setError("Tarmoq xatosi")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteBranch = async (branch: Branch) => {
    setIsDeleting(branch.id)
    setError("")
    setSuccess("")

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch(API_ENDPOINTS.filial(branch.id), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setBranches(branches.filter((b) => b.id !== branch.id))
        setSuccess("Filial muvaffaqiyatli o'chirildi")
        setActiveDropdown(null)
      } else {
        setError(data.message || "Xatolik yuz berdi")
      }
    } catch (error) {
      setError("Tarmoq xatosi")
    } finally {
      setIsDeleting(null)
    }
  }

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch)
    setEditDialogOpen(true)
    setActiveDropdown(null)
  }

  const openDeleteDialog = (branch: Branch) => {
    handleDeleteBranch(branch)
    setActiveDropdown(null)
  }

  const toggleDropdown = (branchId: number) => {
    setActiveDropdown(activeDropdown === branchId ? null : branchId)
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
                <h1 className="text-2xl font-bold">Filiallar</h1>
                <p className="text-muted-foreground">Restoran filiallari boshqaruvi</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user?.is_admin && <Badge variant="secondary">Admin</Badge>}
              {user?.is_admin && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Yangi filial
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yangi filial qo'shish</DialogTitle>
                      <DialogDescription>Yangi filial ma'lumotlarini kiriting</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddBranch} className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="name">Filial nomi</Label>
                        <Input
                          id="name"
                          placeholder="Masalan: Yunusobod filiali"
                          value={newBranch.name}
                          onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Manzil</Label>
                        <Input
                          id="location"
                          placeholder="Masalan: Yunusobod tumani"
                          value={newBranch.location}
                          onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })}
                          required
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          Bekor qilish
                        </Button>
                        <Button type="submit" disabled={isAddingBranch}>
                          {isAddingBranch ? (
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
              <Card key={branch.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{branch.name}</CardTitle>
                        <CardDescription>{branch.location}</CardDescription>
                      </div>
                    </div>
                    {user?.is_admin && (
                      <div className="relative dropdown-container">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDropdown(branch.id)}
                          className="p-1 hover:bg-accent"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        {activeDropdown === branch.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-50">
                            <div className="py-1">
                              <Button
                                variant="ghost"
                                className="w-full justify-start text-left h-auto py-2 px-4 text-sm hover:bg-accent hover:text-accent-foreground"
                                onClick={() => openEditDialog(branch)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Tahrirlash
                              </Button>
                              <Button
                                variant="ghost"
                                className="w-full justify-start text-left h-auto py-2 px-4 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => openDeleteDialog(branch)}
                                disabled={isDeleting === branch.id}
                              >
                                {isDeleting === branch.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 mr-2" />
                                )}
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
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Faol
                    </Badge>
                    <div className="text-sm text-muted-foreground">ID: {branch.id}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {branches.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Filiallar topilmadi</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Hozircha hech qanday filial qo'shilmagan. Yangi filial qo'shish uchun yuqoridagi tugmani bosing.
                </p>
                {user?.is_admin && (
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Birinchi filialni qo'shish
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </main>

        {/* Edit dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filialni tahrirlash</DialogTitle>
              <DialogDescription>Filial ma'lumotlarini yangilang</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditBranch} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-name">Filial nomi</Label>
                <Input
                  id="edit-name"
                  placeholder="Masalan: Yunusobod filiali"
                  value={editingBranch?.name || ""}
                  onChange={(e) =>
                    setEditingBranch(editingBranch ? { ...editingBranch, name: e.target.value } : null)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Manzil</Label>
                <Input
                  id="edit-location"
                  placeholder="Masalan: Yunusobod tumani"
                  value={editingBranch?.location || ""}
                  onChange={(e) =>
                    setEditingBranch(editingBranch ? { ...editingBranch, location: e.target.value } : null)
                  }
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
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
      </div>
    </div>
  )
}