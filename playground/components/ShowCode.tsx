import React, { useState, useMemo, useImperativeHandle, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import 'highlight.js/styles/atom-one-dark.css'

hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml)

interface ShowCodeProps {
  filename: string
  code: string
}

export interface ShowCodeHandle {
  open: () => void
}

const ShowCode = forwardRef<ShowCodeHandle, ShowCodeProps>(({ filename, code }, ref) => {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  useImperativeHandle(ref, () => ({
    open: () => {
      setVisible(true)
      document.body.style.overflow = 'hidden'
    }
  }))

  const close = () => {
    setVisible(false)
    document.body.style.overflow = ''
  }

  const highlighted = useMemo(() => {
    return hljs.highlight(code, { language: 'xml' }).value
  }, [code])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!visible) return null

  return createPortal(
    <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <div style={styles.dialog}>
        <div style={styles.header}>
          <span style={styles.filename}>{filename}</span>
          <div style={styles.actions}>
            <button style={styles.btn} onClick={handleCopy}>
              {copied ? '✓ Copy' : '📋 Copy'}
            </button>
            <button style={{ ...styles.btn, ...styles.btnClose }} onClick={close}>✕</button>
          </div>
        </div>
        <div style={styles.body}>
          <pre style={styles.pre}>
            <code dangerouslySetInnerHTML={{ __html: highlighted }} />
          </pre>
        </div>
      </div>
    </div>,
    document.body
  )
})

ShowCode.displayName = 'ShowCode'

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%', maxWidth: 860, maxHeight: '85vh',
    borderRadius: 12, background: '#0d1117',
    boxShadow: '0 20px 60px rgba(0,0,0,.5)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 18px', borderBottom: '1px solid #30363d', flexShrink: 0,
  },
  filename: { fontSize: 13, fontFamily: 'monospace', color: '#8b949e' },
  actions: { display: 'flex', alignItems: 'center', gap: 8 },
  btn: {
    fontSize: 12, padding: '4px 12px', borderRadius: 6,
    border: '1px solid #30363d', background: '#21262d', color: '#c9d1d9',
    cursor: 'pointer',
  },
  btnClose: { padding: '4px 8px', fontSize: 14 },
  body: { overflow: 'auto', flex: 1 },
  pre: {
    margin: 0, padding: 18, fontSize: 13, lineHeight: 1.6,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    whiteSpace: 'pre', tabSize: 2, color: '#abb2bf', background: '#282c34',
  },
}

export default ShowCode
