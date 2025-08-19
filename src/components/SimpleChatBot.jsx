import { useState } from "react"
import { Button } from "@/components/ui/button"

const SimpleChatBot = () => {
  const [message, setMessage] = useState('')
  
  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Simple Chat Test</h1>
      </div>
      
      <div className="flex-1 p-4">
        <div className="bg-gray-100 p-3 rounded-lg mb-4">
          <p>Hello! This is a test message.</p>
        </div>
      </div>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <Button onClick={() => setMessage('')}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SimpleChatBot
