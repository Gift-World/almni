"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useParams } from "next/navigation"

export default function StudentsAdminPage() {
  const params = useParams()
  const domain = params.domain as string
  const supabase = createClient()
  const [students, setStudents] = useState<any[]>([])

  useEffect(() => {
    async function fetchStudents() {
      const { data: uni } = await supabase.from('universities').select('id').eq('subdomain', domain).single()
      if (uni) {
        const { data } = await supabase.from('student_profiles').select('*').eq('university_id', uni.id)
        if (data) setStudents(data)
      }
    }
    fetchStudents()
  }, [domain, supabase])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Students Directory</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {students.length === 0 ? <p className="text-slate-500">No students found.</p> : (
           <ul>
             {students.map(s => <li key={s.id} className="py-2 border-b">{s.first_name} {s.last_name}</li>)}
           </ul>
        )}
      </div>
    </div>
  )
}
