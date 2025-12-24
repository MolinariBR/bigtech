"use client"

import * as React from "react"

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'var(--overlay-bg)' }}>
      <div className="bg-card text-card-foreground rounded-lg shadow-lg max-w-md w-full mx-4 p-4">
        <button
          onClick={onClose}
          className="float-right text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;