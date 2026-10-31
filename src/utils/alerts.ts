import Swal from 'sweetalert2';

export const alerts = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonColor: '#2563eb',
      timer: 2500,
      timerProgressBar: true,
    });
  },

  error: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonColor: '#ef4444',
    });
  },

  warning: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#f59e0b',
    });
  },

  info: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'info',
      title,
      text,
      confirmButtonColor: '#2563eb',
    });
  },

  confirm: async (title: string, text: string, confirmText = 'ຢືນຢັນ / Confirm', cancelText = 'ຍົກເລີກ / Cancel'): Promise<boolean> => {
    const res = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
    });
    return res.isConfirmed;
  },

  promptText: async (title: string, placeholder = '', confirmText = 'ຢືນຢັນ / Confirm'): Promise<string | null> => {
    const res = await Swal.fire({
      title,
      input: 'textarea',
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: confirmText,
      cancelButtonText: 'ຍົກເລີກ / Cancel',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'ກະລຸນາໃສ່ຄຳເຫັນ ຫຼື ເຫດຜົນ / Please provide comment or reason';
        }
        return null;
      },
    });

    if (res.isConfirmed && res.value) {
      return res.value;
    }
    return null;
  },
};
