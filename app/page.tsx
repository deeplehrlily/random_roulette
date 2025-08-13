"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ExternalLink, Sparkles } from "lucide-react"

interface Prize {
  name: string
  inventory: number
  color: string
  angle: number
  demandLink: string
  emoji: string
}

export default function KoreanRoulette() {
  const [prizes, setPrizes] = useState<Prize[]>([
    {
      name: "츄파 suç트스",
      inventory: 1494,
      color: "#FF6B6B",
      angle: 0,
      demandLink: "https://example.com/chupachups",
      emoji: "🍭",
    },
    {
      name: "네이버페이 상품권 1천원",
      inventory: 320,
      color: "#6CD1E8",
      angle: 0,
      demandLink: "https://example.com/naverpay",
      emoji: "💳",
    },
    {
      name: "교촌치킨 허니 기프티콘",
      inventory: 55,
      color: "#FFE66D",
      angle: 0,
      demandLink: "https://example.com/kyochon",
      emoji: "🍗",
    },
  ])

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  })

  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Prize | null>(null)
  const [rotation, setRotation] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const totalInventory = prizes.reduce((sum, prize) => sum + prize.inventory, 0)
    let currentAngle = 0

    const updatedPrizes = prizes.map((prize) => {
      const proportion = prize.inventory / totalInventory
      const angle = proportion * 360
      const prizeWithAngle = { ...prize, angle: currentAngle }
      currentAngle += angle
      return prizeWithAngle
    })

    setPrizes(updatedPrizes)
  }, [])

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, "")
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData((prev) => ({ ...prev, phone: formatted }))
  }

  const handleFormSubmit = () => {
    if (!formData.name || !formData.phone || !formData.email) {
      alert("모든 정보를 입력해주세요!")
      return
    }
    setShowForm(false)
    spinWheel()
  }

  const spinWheel = async () => {
    setIsSpinning(true)
    setWinner(null)
    setShowResult(false)
    setShowConfetti(false)

    const totalInventory = prizes.reduce((sum, prize) => sum + prize.inventory, 0)
    const random = Math.random() * totalInventory
    let currentSum = 0
    let selectedPrize = prizes[0]
    let prizeIndex = 0

    for (let i = 0; i < prizes.length; i++) {
      currentSum += prizes[i].inventory
      if (random <= currentSum) {
        selectedPrize = prizes[i]
        prizeIndex = i
        break
      }
    }

    const targetAngle = selectedPrize.angle + Math.random() * (360 / prizes.length)
    const spinRotation = 1800 + targetAngle

    setRotation((prev) => prev + spinRotation)

    setTimeout(async () => {
      setIsSpinning(false)
      setWinner(selectedPrize)
      setShowResult(true)
      setShowConfetti(true)

      const newInventory = Math.max(0, selectedPrize.inventory - 1)
      setPrizes((prev) =>
        prev.map((prize) => (prize.name === selectedPrize.name ? { ...prize, inventory: newInventory } : prize)),
      )

      try {
        // Save winner information
        const winnerResponse = await fetch(
          "https://script.google.com/macros/s/AKfycbzwoiWvBlBjG7GPhLlezWvYFp4j7c3UWUfmcKsL184ZD13mau_RzC4Rv7rR7wBWp9DR1A/exec",
          {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "addWinner",
              name: formData.name,
              phone: formData.phone,
              email: formData.email,
              prize: selectedPrize.name,
              timestamp: new Date().toISOString(),
            }),
          },
        )

        // Update inventory in Google Sheets
        const inventoryResponse = await fetch(
          "https://script.google.com/macros/s/AKfycbzwoiWvBlBjG7GPhLlezWvYFp4j7c3UWUfmcKsL184ZD13mau_RzC4Rv7rR7wBWp9DR1A/exec",
          {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "updateInventory",
              prizeIndex: prizeIndex,
              prizeName: selectedPrize.name,
              newInventory: newInventory,
              timestamp: new Date().toISOString(),
            }),
          },
        )

        console.log("Data successfully sent to Google Sheets")
      } catch (error) {
        console.error("Failed to save to Google Sheets:", error)
        alert("당첨 정보 저장 중 오류가 발생했습니다. 고객센터로 문의해주세요.")
      }
    }, 3000)
  }

  const totalInventory = prizes.reduce((sum, prize) => sum + prize.inventory, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-blue-50 to-cyan-200 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-8 h-8 text-pink-300 animate-pulse">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div className="absolute top-40 right-32 w-6 h-6 text-orange-300 animate-bounce">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div className="absolute bottom-32 left-40 w-10 h-10 text-yellow-300 animate-pulse delay-1000">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div className="absolute top-60 right-20 w-12 h-12 bg-pink-200 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute bottom-40 right-60 w-8 h-8 bg-orange-200 rounded-full opacity-40 animate-bounce delay-500"></div>
      </div>

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-2xl mx-auto text-center relative z-10">
        <div className="mb-12">
          <div className="w-16 h-16 bg-gradient-to-r from-[#6CD1E8] to-[#4F9CF9] rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse shadow-lg">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M12 2 L12 12 L22 12" stroke="currentColor" strokeWidth="2" />
              <path d="M12 12 L2 12" stroke="currentColor" strokeWidth="1" />
              <path d="M12 12 L12 22" stroke="currentColor" strokeWidth="1" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">워크리뷰 행운의 룰렛</h1>
          <p className="text-gray-600 text-lg">참여하고 상품을 받아보세요</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 backdrop-blur-sm border border-white/50">
          <div className="relative w-80 h-80 mx-auto mb-8">
            <div
              ref={wheelRef}
              className="w-full h-full relative z-10"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? "transform 3s cubic-bezier(0.23, 1, 0.32, 1)" : "none",
              }}
            >
              <svg width="320" height="320" viewBox="0 0 320 320" className="drop-shadow-xl">
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.1" />
                  </filter>
                </defs>

                <circle cx="160" cy="160" r="155" fill="#6CD1E8" />
                <circle cx="160" cy="160" r="140" fill="white" />

                {prizes.map((prize, index) => {
                  const totalInventory = prizes.reduce((sum, p) => sum + p.inventory, 0)
                  const proportion = prize.inventory / totalInventory
                  const startAngle = prizes
                    .slice(0, index)
                    .reduce((sum, p) => sum + (p.inventory / totalInventory) * 360, 0)
                  const endAngle = startAngle + proportion * 360

                  const startAngleRad = (startAngle - 90) * (Math.PI / 180)
                  const endAngleRad = (endAngle - 90) * (Math.PI / 180)

                  const x1 = 160 + 140 * Math.cos(startAngleRad)
                  const y1 = 160 + 140 * Math.sin(startAngleRad)
                  const x2 = 160 + 140 * Math.cos(endAngleRad)
                  const y2 = 160 + 140 * Math.sin(endAngleRad)

                  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

                  const pathData = [
                    `M 160 160`,
                    `L ${x1} ${y1}`,
                    `A 140 140 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    `Z`,
                  ].join(" ")

                  const textAngleRad = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180)
                  const emojiX = 160 + 60 * Math.cos(textAngleRad)
                  const emojiY = 160 + 60 * Math.sin(textAngleRad)

                  return (
                    <g key={index}>
                      <path d={pathData} fill="white" stroke="#E5E7EB" strokeWidth="1" filter="url(#shadow)" />
                      <clipPath id={`clip-${index}`}>
                        <path d={pathData} />
                      </clipPath>
                      <text
                        x={emojiX}
                        y={emojiY}
                        fontSize="36"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        opacity="0.15"
                        fill="#6CD1E8"
                        clipPath={`url(#clip-${index})`}
                      >
                        {prize.emoji}
                      </text>
                    </g>
                  )
                })}

                <circle cx="160" cy="160" r="35" fill="#6CD1E8" filter="url(#shadow)" />
                <text
                  x="160"
                  y="160"
                  fill="white"
                  fontSize="14"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  START
                </text>
              </svg>
            </div>

            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 z-20">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-[#6CD1E8] drop-shadow-lg"></div>
            </div>
          </div>

          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button
                disabled={isSpinning || totalInventory === 0}
                className="bg-gradient-to-r from-[#6CD1E8] to-[#4F9CF9] hover:from-[#5BC5E3] hover:to-[#3B82F6] text-white font-semibold px-12 py-3 rounded-full text-lg shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {isSpinning ? "돌리는 중..." : "참여하기"}
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center text-xl font-bold text-gray-900">참여 정보 입력</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    이름
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="이름을 입력하세요"
                    className="border-gray-200 focus:border-[#6CD1E8] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    전화번호
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    className="border-gray-200 focus:border-[#6CD1E8] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    이메일
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com"
                    className="border-gray-200 focus:border-[#6CD1E8] rounded-lg"
                  />
                </div>
                <Button
                  onClick={handleFormSubmit}
                  className="w-full bg-gradient-to-r from-[#6CD1E8] to-[#4F9CF9] hover:from-[#5BC5E3] hover:to-[#3B82F6] text-white font-semibold py-2 rounded-lg mt-6"
                >
                  룰렛 돌리기
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={showResult} onOpenChange={setShowResult}>
          <DialogContent className="sm:max-w-md text-center">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-4">🎉 축하합니다!</DialogTitle>
            </DialogHeader>
            {winner && (
              <div className="py-6">
                <div className="w-20 h-20 bg-gradient-to-r from-[#6CD1E8] to-[#4F9CF9] rounded-full mx-auto mb-4 flex items-center justify-center animate-bounce shadow-xl">
                  <span className="text-3xl">{winner.emoji}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{winner.name}</h3>
                <p className="text-gray-600 mb-6">당첨되었습니다!</p>
                <Button
                  onClick={() => window.open("https://www.dmand.co.kr/", "_blank")}
                  className="bg-gradient-to-r from-[#6CD1E8] to-[#4F9CF9] hover:from-[#5BC5E3] hover:to-[#3B82F6] text-white font-semibold px-6 py-2 rounded-lg inline-flex items-center gap-2 shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  디맨드 바로가기 <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="bg-white/80 rounded-xl p-6 mb-6 text-left">
          <h3 className="text-lg font-bold text-gray-900 mb-4">이벤트 안내</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• 당첨된 물품은 영업일 기준 2-3일내 작성해주신 정보를 통해서 전달드립니다.</li>
            <li>• 전달 받지 못할 경우 디맨드 카카오채널 혹은 cs@deeplehr.com으로 문의주시기 바랍니다.</li>
            <li>• 현물·현금 당첨 시 제세공과금이 발생할 수 있습니다.</li>
            <li>• 해당 이벤트는 별도 공지 없이 변경 또는 조기 종료될 수 있습니다.</li>
          </ul>
        </div>

        <div className="opacity-5 hover:opacity-100 transition-opacity duration-500">
          <div className="bg-white/50 rounded-lg p-4 text-xs text-gray-500">
            <div className="grid grid-cols-3 gap-4">
              {prizes.map((prize, index) => (
                <div key={index}>
                  <div>{prize.name}</div>
                  <div>재고: {prize.inventory}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
