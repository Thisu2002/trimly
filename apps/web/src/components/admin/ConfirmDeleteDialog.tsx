"use client";

import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Inline confirm dialog (not a full page overlay).
 * Renders inside a fixed modal centered on screen.
 */
export function ConfirmDeleteDialog({
  open,
  title = "Delete this reward?",
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  loading = false,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-[#0b1220] border border-gray-700 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{message}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Deleting..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}