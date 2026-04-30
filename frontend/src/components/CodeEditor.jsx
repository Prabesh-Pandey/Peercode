import { useRef } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { EDITOR_DEFAULTS } from '../constants'

/**
 * Thin wrapper around Monaco that:
 * - applies our default theme/font settings
 * - exposes the editor instance via the `editorRef` prop
 * - calls `onChange(value)` whenever the content changes
 */
export default function CodeEditor({ value, language, onChange, editorRef }) {
  const monacoRef = useRef(null)

  function handleMount(editor, monaco) {
    monacoRef.current = monaco

    // Store editor instance in the parent's ref so Session.jsx can call .getValue()
    if (editorRef) editorRef.current = editor

    // Optional: disable the right-click context menu noise
    editor.updateOptions({ contextmenu: false })
  }

  return (
    <div className="flex-1 overflow-hidden">
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        theme="vs-dark"
        onChange={onChange}
        onMount={handleMount}
        options={{
          fontSize: EDITOR_DEFAULTS.fontSize,
          minimap: { enabled: EDITOR_DEFAULTS.minimap },
          wordWrap: EDITOR_DEFAULTS.wordWrap,
          fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
          fontLigatures: true,
          lineHeight: 22,
          padding: { top: 16 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          renderLineHighlight: 'gutter',
          bracketPairColorization: { enabled: true },
          tabSize: 2,
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-[#1e1e2e]">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        }
      />
    </div>
  )
}
