import { Routes, Route } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/customer/Home'
import Shop from './pages/customer/Shop'
import ProductDetail from './pages/customer/ProductDetail'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import OrderReceipt from './pages/customer/OrderReceipt'
import Orders from './pages/customer/Orders'
import Account from './pages/customer/Account'
import Auth from './pages/customer/Auth'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductForm from './pages/admin/AdminProductForm'
import AdminAgents from './pages/admin/AdminAgents'
import AgentLogin from './pages/agent/AgentLogin'
import AgentPortal from './pages/agent/AgentPortal'
import AgentOrderDetail from './pages/agent/AgentOrderDetail'

function CustomerLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function NotFound() {
  return (
    <div className="texture-paper flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="font-serif text-8xl font-semibold gold-text">404</p>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-espresso-800">This page is lost in the atelier</h1>
      <a href="/" className="btn-gold mt-8">Return Home</a>
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-receipt/:id" element={<OrderReceipt />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/account" element={<Account />} />
          <Route path="/auth" element={<Auth />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="agents" element={<AdminAgents />} />
        </Route>

        <Route path="/agent/login" element={<AgentLogin />} />
        <Route path="/agent" element={<AgentPortal />} />
        <Route path="/agent/order/:id" element={<AgentOrderDetail />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
