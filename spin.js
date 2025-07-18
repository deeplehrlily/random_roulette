const prizes = ["스타벅스", "편의점 천원", "꽝", "네이버페이"];

document.getElementById("spinBtn").onclick = () => {
  const result = prizes[Math.floor(Math.random() * prizes.length)];
  document.getElementById("result").innerText = `당첨 결과: ${result}`;

  // Google Sheet로 결과 전송
  fetch("https://script.google.com/a/macros/deeplehr.com/s/AKfycbyrD3P4Dx_nHtYI1Xgl6dNNoAqLcps37qBSxOzhB6gof9s3agQlHGfDWBqmLy5V3MnmHw/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prize: result,
      email: "example@email.com" // 필요시 사용자 이메일도 저장
    })
  });
};