const devUrl = "http://localhost:3000/report"
const prodUrl = "http://p-c-ers.asakabank.com/report"

export function createModal(img: string, cb?: (status: boolean) => void) {
  // Modal container
  const modal = document.createElement("div")
  modal.id = "bug-modal"
  modal.innerHTML = `
    <style>

      #bug-modal {
        position: fixed;
        top: 0; left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      #bug-modal * {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
      }

      #bug-modal .modal-content {
        background: #fff;
        width: 80%;
        max-width: 95vw;
        padding: 30px;
        border-radius: 30px;
        box-shadow: 0px 2px 6px 0px #0000001F, 0px 0px 2px 0px #0000000F, 0px 4px 10px 0px #00000008;
        font-family: sans-serif;
        display: flex;
        flex-direction: column;
        gap:30px;
        animation: fadeIn 0.2s ease-in-out;
      }

      #bug-modal .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      #bug-modal .modal-header span{
        cursor: pointer;
        font-size: 32px;
        color: #333;
        transition: all 0.2s;
        line-height: 1;
      }

      #bug-modal h2 {
        margin: 0;
        font-size: 20px;
        color: #333;
      }

      #bug-modal img {
        width: 100%;
        max-height: 400px;
        object-fit: cover;
        object-position: top;
        border: 1px solid #CED4DA;
      }

      #bug-modal textarea {
        padding: 15px;
        font-size: 14px;
        border: 1px solid #CED4DA;
        border-radius: 30px;
        outline: none;
        resize: none;
      }

      #bug-modal input {
        padding: 15px;
        font-size: 14px;
        border: 1px solid #CED4DA;
        border-radius: 30px;
        outline: none;
        resize: none;
      }

      #bug-modal textarea:hover,#bug-modal textarea:focus {
        border-color: #232323;
      
      }

      #bug-modal .button-container {
        display: flex;
        justify-content: center;
      }

      #bug-modal button {
        padding: 12px 24px;
        height: 54px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 14px;
        background: #333333;
        color: white;
        border: none;
        border-radius: 30px;
        cursor: pointer;
        transition: all 0.2s;
      }

      #bug-modal button:hover {
        background: #232323;
        box-shadow: 0px 5px 5px 0px #00000040;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
    </style>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Сообщить об ошибке</h2>
        <span id="close-modal">&times;</span>
      </div>
      <img src="${img}" alt="Screenshot"/>
      <input type="tel" pattern="^\+998(9[0-9]|8[1-9]|7[1-9])[0-9]{7}$" placeholder="+998901234567" id="bug-phone" />
      <textarea id="bug-comment" rows="3" placeholder="Оставить комментарий..."></textarea>
      <div class="button-container">
        <button id="send-btn">Отправить ошибку</button>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  document.getElementById("close-modal")?.addEventListener("click", () => {
    localStorage.removeItem("bug-reporter")
    modal.remove()
  })

  document.getElementById("send-btn")?.addEventListener("click", async () => {
    const comment = (
      document.getElementById("bug-comment") as HTMLTextAreaElement
    )?.value
    const phone = (document.getElementById("bug-phone") as HTMLInputElement)
      ?.value
    const data = JSON.parse(localStorage.getItem("LAST_ERROR_REQUEST") || "{}")
    const payload = JSON.stringify({ ...data, image: img, comment, phone })

    try {
      const res = await fetch(prodUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      })

      const responseData = await res.json()

      if (!res.ok) {
        console.error("Server returned error response:", responseData)
        if (cb) cb(false)
      } else {
        if (cb) cb(true)
        localStorage.removeItem("bug-reporter")
      }
    } catch (e) {
      console.error("Network or other error:", e)
      if (cb) cb(false)
    }

    modal.remove()
  })

  const input = document.getElementById("bug-phone")

  input?.addEventListener("input", (e) => {
    // Faqat raqamlar va "+" belgisi ruxsat etiladi
    let value = (e.target as HTMLInputElement)?.value.replace(/[^\d+]/g, "")

    // "+" belgisi faqat boshida bo'lishi mumkin
    if (value.includes("+")) {
      value = "+" + value.replace(/\+/g, "")
    }

    // Maksimal uzunlik nazorati (masalan: +998901234567 — 13 belgidan iborat)
    if (value.length > 13) {
      value = value.slice(0, 13)
    }

    if (e.target) {
      ;(e.target as HTMLInputElement).value = value
    }
  })
}
