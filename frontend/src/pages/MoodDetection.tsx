import React from 'react'
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useToast } from '../hooks/use-toast'

const API_BASE_URL = 'http://localhost:8000'

const MoodDetection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [detectedMood, setDetectedMood] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          } 
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(err => {
            console.error("Error playing video:", err)
            setError("Failed to start video stream")
            toast({
              title: "Video Error",
              description: "Failed to start video stream",
              variant: "destructive",
            })
          })
        }
      } catch (err) {
        console.error("Camera access error:", err)
        setError('Failed to access camera. Please ensure you have granted camera permissions.')
        toast({
          title: "Camera Access Error",
          description: "Failed to access camera. Please ensure you have granted camera permissions.",
          variant: "destructive",
        })
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [toast])

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to get canvas context')

      ctx.drawImage(videoRef.current, 0, 0)
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/jpeg', 0.95)
      })

      // Create FormData and append the blob
      const formData = new FormData()
      formData.append('file', blob, 'capture.jpg')

      // Send the image to the backend with retry logic
      let retries = 3
      let lastError = null

      while (retries > 0) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/mood/detect`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            withCredentials: true
          })

          console.log('Response:', response.data)

          if (response.data.error) {
            throw new Error(response.data.error)
          }

          setDetectedMood(response.data.dominant_emotion)
          toast({
            title: "Mood Detected",
            description: `Your mood is: ${response.data.dominant_emotion}`,
            variant: "default",
          })
          return // Success, exit the retry loop
        } catch (err: any) {
          lastError = err
          console.error("Request error:", err)
          
          if (err.response?.status === 429) {
            // Rate limited, wait before retrying
            const retryAfter = parseInt(err.response.headers['retry-after'] || '5')
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
          } else if (err.response?.status === 403) {
            // CSRF error, no point in retrying
            break
          } else {
            // Other error, wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          retries--
        }
      }

      // If we get here, all retries failed
      throw lastError || new Error('Failed to analyze mood after multiple attempts')
    } catch (err: any) {
      console.error("Analysis error:", err)
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to analyze mood. Please try again.'
      setError(errorMessage)
      toast({
        title: "Analysis Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mood Detection</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-6">
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
          </div>
          <div className="flex justify-center">
            <button
              onClick={captureAndAnalyze}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Analyzing...' : 'Start Detection'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {detectedMood && (
        <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Detected Mood: {detectedMood}
        </div>
      )}
    </div>
  )
}

export default MoodDetection 