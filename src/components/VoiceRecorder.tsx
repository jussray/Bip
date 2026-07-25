/**
 * HTML5 Video API - Voice Recording
 * Uses MediaRecorder API for voice journaling
 */

import React, { useState, useRef } from 'react'

interface VoiceRecorderProps {
  onSave: (blob: Blob) => Promise<void>
  disabled?: boolean
}

export function VoiceRecorder({ onSave, disabled }: VoiceRecorderProps): React.ReactElement {
  const [recording, setRecording] = useState(false)
  const [saving, setSaving] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      chunksRef.current = []

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      })

      mediaRecorder.addEventListener('stop', async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setSaving(true)
        try {
          await onSave(blob)
        } finally {
          setSaving(false)
        }
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      })

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setRecording(true)
    } catch (error) {
      console.error('Microphone access denied:', error)
      alert('Please allow microphone access to record')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {!recording ? (
        <button
          onClick={startRecording}
          disabled={disabled || saving}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-2-9a2 2 0 114 0 2 2 0 01-4 0z" />
          </svg>
          Record
        </button>
      ) : (
        <button
          onClick={stopRecording}
          disabled={saving}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2 animate-pulse"
        >
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          Stop
        </button>
      )}
      {saving && <span className="text-sm text-gray-600">Saving...</span>}
    </div>
  )
}
