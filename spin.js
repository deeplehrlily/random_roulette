const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");

canvas.width = 300;
canvas.height = 300;

const prizeInventory = {
  "츄파춥스": 1950,
  "네이버페이 5천원": 40,
  "BHC 치킨": 10
};

const prizes = [
  { name: "츄파춥스", color: "#F3F4FF" },
  { name: "네이버페이 5천원", color: "#E0E7FF" },
  { name: "BHC 치킨", color: "#CBD5FF" },
  { name: "츄파춥스", color: "#F3F4FF" },
  { name: "네이버페이 5천원", color: "#E0E7FF" },
  { name: "BHC 치킨", color: "#CBD5FF" }
];

const arc = Math.PI * 2 / prizes.length;
let rotation = 0;
let isSpinning = false;
let userInfo = {};

const clickSound = new Audio("sounds/click.mp3");
const winSound = new Audio("sounds/win.mp3");

function drawWheel() {
  for (let i = 0; i < prizes.length; i++) {
    const start = i * arc;
    const end = start + arc;
    ctx.beginPath();
    ctx.fillStyle = prizes[i].color;
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 150, start, end);
    ctx.fill();
    ctx.save();
    ctx.translate(150, 150);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#000";
    ctx.font = "bold 14px Pretendard";
    ctx.fillText(prizes[i].name, 120, 10);
    ctx.restore();
  }
}

drawWheel();

function submitUserInfo() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const email = document.getElementById("email").value;
  if (!name || !phone || !email) {
    alert("정보를 모두 입력해주세요");
    return;
  }
  const key = `${email}-${phone}`;
  if (localStorage.getItem(key)) {
    alert("이미 참여하셨습니다.");
    return;
  }
  userInfo = { name, phone, email };
  localStorage.setItem(key, "true");
  document.getElementById("userModal").style.display = "none";
  spinBtn.style.display = "inline-block";
}

spinBtn.addEventListener("click", () => {
  if (isSpinning) return;
  isSpinning = true;

  const available = prizes.map((p, i) => ({...p, index: i}))
    .filter(p => prizeInventory[p.name] > 0);
  if (available.length === 0) {
    alert("모든 경품이 소진되었습니다.");
    return;
  }

  const selected = available[Math.floor(Math.random() * available.length)];
  const segmentAngle = 360 / prizes.length;
  const stopAngle = segmentAngle * selected.index;
  const extraRotation = 360 * 5;
  const finalRotation = extraRotation + 270 - stopAngle;

  rotation += finalRotation;
  canvas.style.transform = `rotate(${rotation}deg)`;

  let clickCount = 0;
  const interval = setInterval(() => {
    clickSound.play();
    clickCount++;
    if (clickCount >= 12) clearInterval(interval);
  }, 300);

  setTimeout(() => {
    prizeInventory[selected.name]--;
    document.getElementById("resultModal").style.display = "flex";
    document.getElementById("prizeText").innerText = `${userInfo.name}님, ${selected.name}에 당첨되셨습니다!`;
    winSound.play();
    fetch("https://script.google.com/macros/s/YOUR_WEB_APP_URL/exec", {
      method: "POST",
      body: JSON.stringify({
        prize: selected.name,
        time: new Date().toISOString(),
        name: userInfo.name,
        phone: userInfo.phone,
        email: userInfo.email
      }),
      headers: { "Content-Type": "application/json" }
    });
    isSpinning = false;
  }, 4000);
});
