import { CLIENT_ERROR_LOGS, LAST_ERROR_REQUEST } from "../constants"
import { SubmitHandler } from "../types"
import { getTranslations } from "../utils/getTranslation"

export function createModal(
  img: string,
  submitCallback: SubmitHandler,
  locale?: "uz" | "ru" | "en" | "o'z",
  showJiraCreds?: boolean
) {
  // Modal container
  const t = getTranslations(locale)
  const modal = document.createElement("div")
  document.body.style.overflow = "hidden"
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

      #bug-modal form {
        display: flex;
        flex-direction: column;
        gap:16px;
        }

      #bug-modal .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      #bug-modal .modal-header span{
        cursor: pointer;
        font-size: 24px;
        color: #333;
        transition: all 0.2s;
        line-height: 1;
      }

      #bug-modal h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
      
      #bug-modal h3 {
        margin: 0;
        font-size: 20px;
        color: #065cb9;
        text-align: center;
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
        gap: 10px;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 150px;
      }

      #bug-modal button:hover {
        background: #232323;
        box-shadow: 0px 5px 5px 0px #00000040;
      }

      #bug-modal button:disabled {
        background: #E5E5E5;
        cursor: not-allowed;
        color: #6C757D;
      }

      #bug-modal .loader {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        position: relative;
        animation: rotate 1s linear infinite
      }

      #bug-modal .loader.hide {
        display: none;
      }

      #bug-modal .jira-creds {
        display: flex;
        flex-direction: column;
        gap:16px;
      }

      #bug-modal .loader::before {
        content: "";
        box-sizing: border-box;
        position: absolute;
        inset: 0px;
        border-radius: 50%;
        border: 3px solid #6C757D;
        animation: prixClipFix 2s linear infinite ;
      }

      @keyframes rotate {
        100%   {transform: rotate(360deg)}
      }

      @keyframes prixClipFix {
        0%   {clip-path:polygon(50% 50%,0 0,0 0,0 0,0 0,0 0)}
        25%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 0,100% 0,100% 0)}
        50%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)}
        75%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 100%)}
        100% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 0)}
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }

    </style>
    <div class="modal-content">
      <div class="modal-header">
        <h2>${t("title")}</h2>
        <span id="close-modal">&times;</span>
      </div>
      
      <form id="bug-modal-form" class="report-form">
        <img src="${img}" alt="Screenshot"/>
        <input type="tel" pattern="^\+998(9[0-9]|8[1-9]|7[1-9])[0-9]{7}$" placeholder="+998901234567" id="bug-phone" />
        <textarea id="bug-comment" rows="3" placeholder="${t(
          "leave_comment"
        )}..."></textarea>
        <div class="button-container">
          <button ${!showJiraCreds ? 'id="send-btn"' : ""} type="submit">
          ${
            !showJiraCreds
              ? '<span id="bug-loader" class="loader hide"></span>'
              : ""
          }
            
            <span>${t(showJiraCreds ? "continue" : "send")}</span>
          </button>
        </div>
      </form>
      ${
        showJiraCreds
          ? `
        <form id="bug-jira-creds-form" class="report-form" style="display:none;">
        <h3>${t("enter_jira_creds")}</h3>
        <div class="jira-creds">
          <input type="text" id="bug-username" required placeholder="${t(
            "username"
          )}" />
          <input type="password" id="bug-password" required placeholder="${t(
            "password"
          )}" />
        </div>
        <div class="button-container">
          <button id="send-btn" type="submit">
            <span id="bug-loader" class="loader hide"></span>
            <span>${t("send")}</span>
          </button>
        </div>
      </form>
        `
          : ""
      }
    </div>
  `

  document.body.appendChild(modal)
  const form = document.querySelectorAll(".report-form")
  let isShowJiraFields = false

  const closeModal = () => {
    modal.remove()
    sessionStorage.removeItem(CLIENT_ERROR_LOGS)
    sessionStorage.removeItem(LAST_ERROR_REQUEST)
    document.body.style.overflow = "auto"
  }

  document.getElementById("close-modal")?.addEventListener("click", () => {
    closeModal()
  })

  const sendData = async () => {
    const btn = document.getElementById("send-btn")
    const loader = document.getElementById("bug-loader")

    const comment = (
      document.getElementById("bug-comment") as HTMLTextAreaElement
    )?.value
    const phone = (document.getElementById("bug-phone") as HTMLInputElement)
      ?.value
    const username = (
      document.getElementById("bug-username") as HTMLInputElement
    )?.value
    const password = (
      document.getElementById("bug-password") as HTMLInputElement
    )?.value

    console.log(username, password)

    if (showJiraCreds && (!username || !password)) {
      alert(t("jira_creds_required"))
      return
    }

    btn?.setAttribute("disabled", "true")
    loader?.classList.remove("hide")

    await submitCallback({
      comment,
      phone,
      ...(showJiraCreds ? { username, password } : {}),
    })

    btn?.removeAttribute("disabled")
    loader?.classList.add("hide")
    closeModal()
  }

  form.forEach((f) => {
    f?.addEventListener("submit", async (e) => {
      e.preventDefault()
      console.log(isShowJiraFields)

      if (showJiraCreds && !isShowJiraFields) {
        isShowJiraFields = true
        const jiraForm = document.getElementById("bug-jira-creds-form")
        const contentForm = document.getElementById("bug-modal-form")
        if (jiraForm) {
          jiraForm.style.display = "flex"
        }
        if (contentForm) {
          contentForm.style.display = "none"
        }
        return
      }
      console.log(1)

      sendData()
    })
  })

  const input = document.getElementById("bug-phone")

  input?.addEventListener("input", (e) => {
    let value = (e.target as HTMLInputElement)?.value.replace(/[^\d+]/g, "")

    if (value.includes("+")) {
      value = "+" + value.replace(/\+/g, "")
    }

    if (value.length > 13) {
      value = value.slice(0, 13)
    }

    if (e.target) {
      ;(e.target as HTMLInputElement).value = value
    }
  })
}
