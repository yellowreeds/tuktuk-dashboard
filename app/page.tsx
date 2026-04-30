'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowPathIcon, ArrowDownTrayIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

interface SmsMessage {
  id: number
  phone_number: string
  message_content: string
  received_at: number
  created_at: string
}

function formatPhoneNumber(number: string): string {
  const cleaned = number.trim()
  if (/^0[17][0-9]{8,9}$/.test(cleaned)) {
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
    }
  }
  return cleaned
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Dashboard() {
  const [messages, setMessages] = useState<SmsMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const totalSms = messages.length
  const todaySms = messages.filter(m => m.received_at >= today.getTime()).length
  const weekSms = messages.filter(m => m.received_at >= weekAgo.getTime()).length

  const filtered = messages.filter(m =>
    formatPhoneNumber(m.phone_number).includes(search) ||
    m.message_content.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  useEffect(() => {
    fetchMessages()
  }, [])

  async function fetchMessages() {
    setLoading(true)
    const { data, error } = await supabase
      .from('sms_messages')
      .select('*')
      .order('received_at', { ascending: false })

    if (error) {
      console.error('Error fetching messages:', error)
    } else {
      setMessages(data || [])
    }
    setLoading(false)
  }

  function downloadCsv() {
    const BOM = '\uFEFF'
    const header = 'ID,Phone Number,Message,Received At\n'
    const rows = messages
      .sort((a, b) => a.id - b.id)
      .map(m => {
        const phone = formatPhoneNumber(m.phone_number)
        const message = `"${m.message_content.replace(/"/g, '""')}"`
        const date = formatDate(m.received_at)
        return `${m.id},${phone},${message},${date}`
      })
      .join('\n')

    const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tuktuk_sms_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1A237E] text-white px-8 py-6">
        <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">TukTuk Campaign</p>
        <h1 className="text-3xl font-bold mt-1">SMS Dashboard</h1>
        <p className="text-blue-300 text-sm mt-1">Real-time incoming message monitor</p>
      </div>

      <div className="px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-[#1A237E]">
            <p className="text-gray-500 text-sm">Total SMS</p>
            <p className="text-4xl font-bold text-[#1A237E] mt-1">{totalSms}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Today</p>
            <p className="text-4xl font-bold text-green-600 mt-1">{todaySms}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-400">
            <p className="text-gray-500 text-sm">This Week</p>
            <p className="text-4xl font-bold text-blue-500 mt-1">{weekSms}</p>
          </div>
        </div>

        {/* Table controls */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Message List</h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search by number or message..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#1A237E] placeholder-gray-800 text-gray-900"
              />
              <button
                onClick={fetchMessages}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={downloadCsv}
                className="bg-[#1A237E] hover:bg-[#283593] text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Download CSV
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : (
            <>
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Phone Number</th>
                    <th className="px-4 py-3 text-left">Message</th>
                    <th className="px-4 py-3 text-left">Received At</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-gray-400">
                        No messages found
                      </td>
                    </tr>
                  ) : (
                    paginated.map((msg, index) => (
                      <tr
                        key={msg.id}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="px-4 py-3 text-gray-400 font-mono whitespace-nowrap">{msg.id}</td>
                        <td className="px-4 py-3 font-semibold text-[#1A237E] whitespace-nowrap">
                          {formatPhoneNumber(msg.phone_number)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{msg.message_content}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(msg.received_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-1"
                    >
                      <ArrowLeftIcon className="w-3 h-3" />
                      Prev
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page === totalPages - 1}
                      className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-1"
                    >
                      Next
                      <ArrowRightIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}