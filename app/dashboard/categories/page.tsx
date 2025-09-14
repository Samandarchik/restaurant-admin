"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Coffee, Users, Building2, MapPin, Package, ShoppingCart, Loader2, Menu, UserCheck, Phone, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { API_ENDPOINTS } from "@/lib/config"

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

interface Branch {
  id: number
  name: string
  location: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAssigningBranch, setIsAssigningBranch] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedBranchId, setSelectedBranchId] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Add user form states
  const [newUserName, setNewUserName] = useState("")
  const [newUserPhone, setNewUserPhone] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserBranchId, setNewUserBranchId] = useState("")
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)
  
  const router = useRouter()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Building2, current: false },
    { name: "Filiallar", href: "/dashboard/branches", icon: MapPin, current: false },
    { name: "Kategoriyalar", href: "/dashboard/categories", icon: Package, current: false },
    { name: "Mahsulotlar", href: "/dashboard/products", icon: Coffee, current: false },
    { name: "Foydalanuvchilar", href: "/dashboard/users", icon: Users, current: true },
    { name: "Buyurtmalar", href: "/dashboard/orders", icon: ShoppingCart, current: false },
  ]

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    const user = JSON.parse(userData)
    setCurrentUser(user)

    if (!user.is_admin) {
      router.push("/dashboard")
      return
    }

    fetchData(token)
  }, [router])

  const fetchData = async (token: string) => {
    try {
      const [usersRes, branchesRes] = await Promise.all([
        fetch(API_ENDPOINTS.users, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API_ENDPOINTS.filials, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.data)
      }

      if (branchesRes.ok) {
        const branchesData = await branchesRes.json()
        setBranches(branchesData.data)
      }
    } catch (error) {
      console.error("Data fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignBranch = async () => {
    if (!selectedUser || !selectedBranchId) return

    setIsAssigningBranch(true)
    setError("")
    setSuccess("")

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch(API_ENDPOINTS.assignFilial(selectedUser.id), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ filial_id: Number.parseInt(selectedBranchId) }),
      })

      const data = await response.json()

      if (data.success) {
        const selectedBranch = branches.find((b) => b.id === Number.parseInt(selectedBranchId))
        setUsers(
          users.map((user) =>
            user.id === selectedUser.id
              ? {
                  ...user,
                  filial: selectedBranch
                    ? {
                        id: selectedBranch.id,
                        name: selectedBranch.name,
                        location: selectedBranch.location,
                      }
                    : undefined,
                }
              : user,
          ),
        )
        setSuccess("Filial muvaffaqiyatli belgilandi")
        setDialogOpen(false)
        setSelectedUser(null)
        setSelectedBranchId("")
      } else {
        setError(data.message || "Xatolik yuz berdi")
      }
    } catch (error) {
      setError("Tarmoq xatosi")
    } finally {
      setIsAssigningBranch(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddingUser(true)
    setError("")

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const userData = {
        name: newUserName.trim(),
        phone: newUserPhone.trim(),
        password: newUserPassword,
        is_admin: newUserIsAdmin,
        ...(newUserBranchId && { filial_id: Number.parseInt(newUserBranchId) })
      }

      const response = await fetch(API_ENDPOINTS.register, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (data.success) {
        // Add the new user to the list
        const selectedBranch = branches.find((b) => b.id === Number.parseInt(newUserBranchId))
        const newUser: User = {
          id: data.data.id,
          name: newUserName.trim(),
          phone: newUserPhone.trim(),
          is_admin: newUserIsAdmin,
          ...(selectedBranch && {
            filial: {
              id: selectedBranch.id,
              name: selectedBranch.name,
              location: selectedBranch.location,
            }
          })
        }
        
        setUsers([...users, newUser])
        setSuccess("Yangi foydalanuvchi muvaffaqiyatli qo'shildi")
        
        // Reset form
        setNewUserName("")
        setNewUserPhone("")
        setNewUserPassword("")
        setNewUserBranchId("")
        setNewUserIsAdmin(false)
        setAddUserDialogOpen(false)
      } else {
        setError(data.message || "Foydalanuvchi qo'shishda xatolik yuz berdi")
      }
    } catch (error) {
      setError("Tarmoq xatosi")
    } finally {
      setIsAddingUser(false)
    }
  }

  const openAssignDialog = (user: User) => {
    setSelectedUser(user)
    setSelectedBranchId(user.filial?.id.toString() || "")
    setDialogOpen(true)
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
                <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>
                <p className="text-muted-foreground">Tizim foydalanuvchilari boshqaruvi</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser?.is_admin && <Badge variant="secondary">Admin</Badge>}
              {currentUser?.is_admin && (
                <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Yangi foydalanuvchi
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Yangi foydalanuvchi qo'shish</DialogTitle>
                      <DialogDescription>Yangi foydalanuvchi ma'lumotlarini kiriting</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddUser} className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="name">To'liq ismi</Label>
                        <Input
                          id="name"
                          placeholder="Masalan: Akmal Karimov"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon raqami</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Masalan: +998901234567"
                          value={newUserPhone}
                          onChange={(e) => setNewUserPhone(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Parol</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Kamida 6 ta belgi"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="branch">Filial (ixtiyoriy)</Label>
                        <Select value={newUserBranchId} onValueChange={setNewUserBranchId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filialni tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id.toString()}>
                                {branch.name} - {branch.location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isAdmin"
                          checked={newUserIsAdmin}
                          onCheckedChange={(checked) => setNewUserIsAdmin(checked as boolean)}
                        />
                        <Label htmlFor="isAdmin" className="text-sm">
                          Administrator huquqlari berish
                        </Label>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setAddUserDialogOpen(false)}>
                          Bekor qilish
                        </Button>
                        <Button type="submit" disabled={isAddingUser}>
                          {isAddingUser ? (
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-foreground">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{user.name}</CardTitle>
                        <CardDescription className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{user.phone}</span>
                        </CardDescription>
                      </div>
                    </div>
                    {user.is_admin && (
                      <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                        Admin
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Filial:</p>
                      {user.filial ? (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{user.filial.name}</p>
                            <p className="text-xs text-muted-foreground">{user.filial.location}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Filial belgilanmagan</p>
                      )}
                    </div>

                    {!user.is_admin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        onClick={() => openAssignDialog(user)}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Filial belgilash
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {users.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Foydalanuvchilar topilmadi</h3>
                <p className="text-muted-foreground text-center">
                  Hozircha tizimda ro'yxatdan o'tgan foydalanuvchilar yo'q.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Assign Branch Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filial belgilash</DialogTitle>
                <DialogDescription>{selectedUser?.name} foydalanuvchisiga filial belgilang</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="branch">Filial</Label>
                  <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filialni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.name} - {branch.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Bekor qilish
                  </Button>
                  <Button onClick={handleAssignBranch} disabled={isAssigningBranch || !selectedBranchId}>
                    {isAssigningBranch ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Belgilanmoqda...
                      </>
                    ) : (
                      "Belgilash"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}