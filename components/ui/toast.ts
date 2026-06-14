/**
 * Centralized toast notification helpers.
 * Wraps `sonner` so we have a consistent API across the whole app.
 * UX-001: Replace all native alert() / confirm() calls with these helpers.
 */
import { toast } from 'sonner';

export const notify = {
  /** Green success toast */
  success: (msg: string) => toast.success(msg),

  /** Red error toast */
  error: (msg: string) => toast.error(msg),

  /** Blue info toast */
  info: (msg: string) => toast.info(msg),

  /** Yellow warning toast */
  warning: (msg: string) => toast.warning(msg),

  /** Loading toast — returns toast id so you can dismiss it */
  loading: (msg: string) => toast.loading(msg),

  /** Dismiss a specific toast by id */
  dismiss: (id: string | number) => toast.dismiss(id),
};
