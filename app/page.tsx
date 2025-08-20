"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ExternalLink, Sparkles } from "lucide-react"

interface Prize {
  name: string
  inventory: number
  color: string
  demandLink: string
  emoji: string
}

export default function KoreanRoulette() {
  const [prizes, setPrizes] = useState<Prize[]>([
    {
      name: "츄파츕스",
      inventory: 1494,
      color: "#FF6B6B",
      demandLink: "https://example.com/chupachups",
      emoji: "🍭",
    },
    {
      name: "네이버페이 상품권 1천원",
      inventory: 320,
      color: "#6CD1E8",
      demandLink: "https://example.com/naverpay",
      emoji: "💳",
    },
    {
      name: "교촌치킨 허니 기프티콘",
      inventory: 55,
      color: "#FFE66D",
      demandLink: "https://example.com/kyochon",
      emoji: "🍗",
    },
  ])

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  })

  const [isSelecting, setIsSelecting] = useState(false)
  const [winner, setWinner] = useState<Prize | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [selectedBox, setSelectedBox] = useState<number | null>(null)
  const [hasParticipated, setHasParticipated] = useState(false)

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

  const handleFormSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.email) {
      alert("모든 정보를 입력해주세요!")
      return
    }

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbzidh5mXl6j0T68oqoJCdS5HlTxAaBJGRqEi2HM4oSRDEzATJlkHvuKGW_y2V-u0c3SZg/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "addParticipant",
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            timestamp: new Date().toISOString(),
          }),
        },
      )

      setHasParticipated(true)
      setShowForm(false)
      console.log("Participant data saved to Google Sheets")
    } catch (error) {
      console.error("Failed to save participant data:", error)
      alert("참여 정보 저장 중 오류가 발생했습니다. 다시 시도해주세요.")
      return
    }
  }

  const handleBoxSelect = async (boxIndex: number) => {
    if (isSelecting || !hasParticipated) return

    setSelectedBox(boxIndex)
    setIsSelecting(true)

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

    setTimeout(async () => {
      setIsSelecting(false)
      setWinner(selectedPrize)
      setShowResult(true)
      setShowConfetti(true)

      const newInventory = Math.max(0, selectedPrize.inventory - 1)
      setPrizes((prev) =>
        prev.map((prize) => (prize.name === selectedPrize.name ? { ...prize, inventory: newInventory } : prize)),
      )

      try {
        const winnerResponse = await fetch(
          "https://script.google.com/macros/s/AKfycbzidh5mXl6j0T68oqoJCdS5HlTxAaBJGRqEi2HM4oSRDEzATJlkHvuKGW_y2V-u0c3SZg/exec",
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

        const inventoryResponse = await fetch(
          "https://script.google.com/macros/s/AKfycbzidh5mXl6j0T68oqoJCdS5HlTxAaBJGRqEi2HM4oSRDEzATJlkHvuKGW_y2V-u0c3SZg/exec",
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
    }, 2000)
  }

  const totalInventory = prizes.reduce((sum, prize) => sum + prize.inventory, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-blue-50 to-cyan-200 flex items-center justify-center p-2 sm:p-4 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-6 sm:w-8 h-6 sm:h-8 text-pink-300 animate-pulse">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div className="absolute top-32 sm:top-40 right-16 sm:right-32 w-4 sm:w-6 h-4 sm:h-6 text-orange-300 animate-bounce">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div className="absolute bottom-20 sm:bottom-32 left-20 sm:left-40 w-8 sm:w-10 h-8 sm:h-10 text-yellow-300 animate-pulse delay-1000">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div className="absolute top-40 sm:top-60 right-10 sm:right-20 w-8 sm:w-12 h-8 sm:h-12 bg-pink-200 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute bottom-24 sm:bottom-40 right-32 sm:right-60 w-6 sm:w-8 h-6 sm:h-8 bg-orange-200 rounded-full opacity-40 animate-bounce delay-500"></div>
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

      <div className="w-full max-w-sm sm:max-w-md lg:max-w-2xl mx-auto text-center relative z-10 px-4">
        <div className="mb-8 sm:mb-12">
          <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-r from-[#6CD1E8] to-[#4F9CF9] rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center animate-pulse shadow-lg">
            <span className="text-xl sm:text-2xl">🎁</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            워크리뷰 행운의 박스
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">참여하고 상품을 받아보세요</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 backdrop-blur-sm border border-white/50">
          {hasParticipated && !isSelecting && selectedBox === null ? (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">선물상자를 선택하세요!</h2>
              <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-md mx-auto">
                {[0, 1, 2].map((boxIndex) => (
                  <button
                    key={boxIndex}
                    onClick={() => handleBoxSelect(boxIndex)}
                    className="group relative bg-gradient-to-br from-[#6CD1E8] to-[#4F9CF9] rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2"
                  >
                    <div className="text-4xl sm:text-5xl mb-2 group-hover:animate-bounce">🎁</div>
                    <div className="text-xs sm:text-sm font-semibold text-white opacity-80">{boxIndex + 1}번</div>
                    <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                ))}
              </div>
            </div>
          ) : hasParticipated && isSelecting ? (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">선물상자를 여는 중...</h2>
              <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-md mx-auto">
                {[0, 1, 2].map((boxIndex) => (
                  <div
                    key={boxIndex}
                    className={`relative bg-gradient-to-br rounded-2xl p-6 sm:p-8 shadow-xl transition-all duration-500 ${
                      boxIndex === selectedBox
                        ? "from-yellow-400 to-orange-500 animate-pulse scale-110"
                        : "from-gray-300 to-gray-400 opacity-50"
                    }`}
                  >
                    <div className={`text-4xl sm:text-5xl mb-2 ${boxIndex === selectedBox ? "animate-bounce" : ""}`}>
                      {boxIndex === selectedBox ? "✨" : "🎁"}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-white opacity-80">{boxIndex + 1}번</div>
                  </div>
                ))}
              </div>
            </div>
          ) : !hasParticipated ? (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">먼저 참여하기 버튼을 눌러주세요!</h2>
              <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-md mx-auto">
                {[0, 1, 2].map((boxIndex) => (
                  <div
                    key={boxIndex}
                    className="relative bg-gray-300 rounded-2xl p-6 sm:p-8 shadow-xl opacity-50 cursor-not-allowed"
                  >
                    <div className="text-4xl sm:text-5xl mb-2">🎁</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-600 opacity-80">{boxIndex + 1}번</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button
                disabled={isSelecting || totalInventory === 0 || hasParticipated}
                className="bg-gradient-to-r from-[#6CD1E8] to-[#4F9CF9] hover:from-[#5BC5E3] hover:to-[#3B82F6] text-white font-semibold px-8 sm:px-12 py-2 sm:py-3 rounded-full text-base sm:text-lg shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasParticipated ? "참여 완료" : isSelecting ? "선택 중..." : "참여하기"}
              </Button>
            </DialogTrigger>

            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-center text-lg sm:text-xl font-bold text-gray-900">
                  참여 정보 입력
                </DialogTitle>
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
                    className="border-gray-200 focus:border-[#6CD1E8] rounded-lg h-12"
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
                    className="border-gray-200 focus:border-[#6CD1E8] rounded-lg h-12"
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
                    className="border-gray-200 focus:border-[#6CD1E8] rounded-lg h-12"
                  />
                </div>
                <Button
                  onClick={handleFormSubmit}
                  className="w-full bg-gradient-to-r from-[#6CD1E8] to-[#4F9CF9] hover:from-[#5BC5E3] hover:to-[#3B82F6] text-white font-semibold py-3 rounded-lg mt-6 h-12"
                >
                  참여 정보 저장하기
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={showResult} onOpenChange={setShowResult}>
          <DialogContent className="w-[95vw] max-w-md mx-auto text-center">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">🎉 축하합니다!</DialogTitle>
            </DialogHeader>
            {winner && (
              <div className="py-6">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-r from-[#6CD1E8] to-[#4F9CF9] rounded-full mx-auto mb-4 flex items-center justify-center animate-bounce shadow-xl">
                  <span className="text-2xl sm:text-3xl">{winner.emoji}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{winner.name}</h3>
                <p className="text-gray-600 mb-6">당첨되었습니다!</p>
                <Button
                  onClick={() => window.open("https://www.dmand.co.kr/", "_blank")}
                  className="bg-gradient-to-r from-[#6CD1E8] to-[#4F9CF9] hover:from-[#5BC5E3] hover:to-[#3B82F6] text-white font-semibold px-6 py-3 rounded-lg inline-flex items-center gap-2 shadow-lg transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                >
                  디맨드 바로가기 <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="bg-white/80 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 text-left">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">이벤트 안내</h3>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <li>• 당첨된 물품은 영업일 기준 2-3일내 작성해주신 정보를 통해서 전달드립니다.</li>
            <li>• 전달 받지 못할 경우 디맨드 카카오채널 혹은 cs@deeplehr.com으로 문의주시기 바랍니다.</li>
            <li>• 현물·현금 당첨 시 제세공과금이 발생할 수 있습니다.</li>
            <li>• 해당 이벤트는 별도 공지 없이 변경 또는 조기 종료될 수 있습니다.</li>
          </ul>
        </div>

        <div className="opacity-5 hover:opacity-100 transition-opacity duration-500">
          <div className="bg-white/50 rounded-lg p-3 sm:p-4 text-xs text-gray-500">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              {prizes.map((prize, index) => (
                <div key={index} className="text-center sm:text-left">
                  <div className="font-medium">{prize.name}</div>
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
