import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { BrandLogo } from './BrandLogo'
import { ReceiptData } from '../../types/models'
import { formatCurrency, formatDate, formatFeeMonth, formatCNIC } from '../../utils/formatters'
import { printReceipt, downloadReceiptAsImage } from '../../utils/receiptGenerator'
import { Printer, Download, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'

export interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  receipt: ReceiptData | null
  isLoading?: boolean
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
  isLoading = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  if (!receipt && !isLoading) return null

  const isVoided = receipt?.status === 'voided'
  const receiptElementId = `receipt-${receipt?.receipt_number}`

  const handleDownload = async () => {
    if (!receipt || isDownloading) return
    setIsDownloading(true)
    setDownloadSuccess(false)
    try {
      const result = await downloadReceiptAsImage(receipt)
      if (result.success) {
        setDownloadSuccess(true)
        setTimeout(() => setDownloadSuccess(false), 3500)
      }
    } catch (err) {
      console.error('Failed to download receipt image:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <span>Official Payment Receipt</span>
          {isVoided && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold tracking-wider uppercase">
              Voided
            </span>
          )}
        </div>
      }
      description={`Receipt Ref: ${receipt?.receipt_number || 'Loading...'}`}
    >
      <div className="space-y-6">
        {/* Printable & Downloadable Container */}
        <div
          id={receiptElementId}
          className={`bg-white p-6 sm:p-8 rounded-2xl border ${
            isVoided ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
          } shadow-sm relative overflow-hidden`}
        >
          {/* Watermark for Voided Receipt */}
          {isVoided && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 rotate-[-25deg]">
              <span className="text-7xl sm:text-9xl font-extrabold text-rose-600 uppercase tracking-widest border-8 border-rose-600 p-4 rounded-3xl">
                VOIDED
              </span>
            </div>
          )}

          {/* Header with Hostel Brand & Receipt Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="space-y-1">
              <BrandLogo variant="full" iconSize={32} />
              <div className="pt-2">
                <h4 className="font-bold text-text-primary text-base sm:text-lg">
                  {receipt?.hostel.name}
                </h4>
                <p className="text-xs text-text-secondary">{receipt?.hostel.address}</p>
                {receipt?.hostel.phone && (
                  <p className="text-xs text-text-secondary">Tel: {receipt.hostel.phone}</p>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto border sm:border-0 border-slate-200/80">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Receipt
              </div>
              <p className="text-xs text-text-secondary mt-1">Receipt No:</p>
              <p className="font-mono font-bold text-sm text-text-primary">{receipt?.receipt_number}</p>
              <p className="text-xs text-text-secondary">Date: {formatDate(receipt?.payment_date)}</p>
            </div>
          </div>

          {/* Resident Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-200 text-xs">
            <div>
              <p className="text-text-secondary font-medium">Resident Name</p>
              <p className="font-bold text-text-primary text-sm mt-0.5">{receipt?.resident.full_name}</p>
              <p className="text-slate-400 font-mono text-[11px]">{receipt?.resident.resident_id}</p>
            </div>

            <div>
              <p className="text-text-secondary font-medium">CNIC No.</p>
              <p className="font-semibold text-text-primary mt-0.5">
                {formatCNIC(receipt?.resident.cnic) || '—'}
              </p>
            </div>

            <div>
              <p className="text-text-secondary font-medium">Room & Bed</p>
              <p className="font-semibold text-text-primary mt-0.5">
                {receipt?.room_number ? `Room ${receipt.room_number}` : '—'}{' '}
                {receipt?.bed_number ? `• Bed ${receipt.bed_number}` : ''}
              </p>
            </div>

            <div>
              <p className="text-text-secondary font-medium">Payment Mode</p>
              <p className="font-semibold text-text-primary capitalize mt-0.5">
                {receipt?.payment_method?.replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Billing & Payment Breakdown Table */}
          <div className="py-6 border-b border-slate-200">
            <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
              Payment Summary
            </h5>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span>Billing Period:</span>
                <span className="font-semibold text-text-primary">
                  {formatFeeMonth(receipt?.fee_month)}
                </span>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <span>Total Fee Due:</span>
                <span className="font-medium text-text-primary">
                  {formatCurrency(receipt?.fee_total_due)}
                </span>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <span>Total Paid to Date:</span>
                <span className="font-medium text-emerald-600">
                  {formatCurrency(receipt?.fee_total_paid)}
                </span>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <span>Remaining Balance:</span>
                <span className="font-medium text-text-primary">
                  {formatCurrency(receipt?.fee_remaining_balance)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm sm:text-base font-bold text-text-primary">
                <span>Amount Paid This Transaction:</span>
                <span className="text-blue-brand text-lg">
                  {formatCurrency(receipt?.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes or Void Info */}
          {receipt?.notes && (
            <div className="pt-4 text-xs">
              <span className="text-text-secondary font-medium">Notes: </span>
              <span className="text-text-primary italic">{receipt.notes}</span>
            </div>
          )}

          {isVoided && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Payment Voided</span>
              </div>
              <p>Reason: {receipt.void_reason || 'No reason specified'}</p>
              {receipt.voided_at && <p>Voided on: {formatDate(receipt.voided_at)}</p>}
            </div>
          )}

          {/* Footer Note & Digital Stamp */}
          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-text-secondary">
            <div>
              <p>This is a computer-generated receipt issued by HostelHUB.</p>
              <p className="text-slate-400">Manage Better. Grow Faster.</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Digital Record Authenticated</span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={printReceipt}
          >
            Print
          </Button>
          <Button
            variant={downloadSuccess ? 'success' : 'primary'}
            size="sm"
            leftIcon={
              downloadSuccess ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )
            }
            isLoading={isDownloading}
            onClick={handleDownload}
          >
            {downloadSuccess ? 'Saved / Downloaded' : 'Download Image'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
