import React, { useState, useEffect } from 'react'
import { residentsService } from '../../services/residents/residentsService'
import { storageService } from '../../services/storage/storageService'
import { ResidentWithDetails } from '../../types/models'
import { Skeleton } from '../../components/ui/Skeleton'
import { FileText, Shield, CheckCircle2 } from 'lucide-react'

export const ResidentDocumentsPage: React.FC = () => {
  const [resident, setResident] = useState<ResidentWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [frontDocUrl, setFrontDocUrl] = useState<string | null>(null)
  const [backDocUrl, setBackDocUrl] = useState<string | null>(null)

  useEffect(() => {
    residentsService
      .getResidentForCurrentUser()
      .then((data) => {
        setResident(data)
        if (data?.documents) {
          const front = data.documents.find((d) => d.document_type === 'cnic_front')
          const back = data.documents.find((d) => d.document_type === 'cnic_back')

          if (front) storageService.getSignedUrl('resident-documents', front.storage_path).then(setFrontDocUrl)
          if (back) storageService.getSignedUrl('resident-documents', back.storage_path).then(setBackDocUrl)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <Skeleton className="h-64 w-full" />

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          Verified Identity Documents
        </h2>
        <p className="text-xs text-text-secondary">
          Encrypted CNIC front/back copies stored securely in private cloud storage
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* CNIC Front */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              CNIC Front Side
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Verified
            </span>
          </div>

          {frontDocUrl ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-black/5 flex items-center justify-center">
              <img src={frontDocUrl} alt="CNIC Front" className="w-full h-auto object-contain" />
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              No CNIC front copy uploaded.
            </div>
          )}
        </div>

        {/* CNIC Back */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              CNIC Back Side
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Verified
            </span>
          </div>

          {backDocUrl ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-black/5 flex items-center justify-center">
              <img src={backDocUrl} alt="CNIC Back" className="w-full h-auto object-contain" />
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              No CNIC back copy uploaded.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
