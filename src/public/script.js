const getDocumentById = (id) => {
  return document.getElementById(id);
};

const password = getDocumentById("password");
const confirmPassword = getDocumentById("confirm-password");
const form = getDocumentById("form");
const container = getDocumentById("container");
const loader = getDocumentById("loader");
const button = getDocumentById("submit");
const error = getDocumentById("error");
const success = getDocumentById("success");

error.style.display = "none";
success.style.display = "none";
container.style.display = "none";

let token, userId;
const passwordRegex =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/;

window.addEventListener("DOMContentLoaded", async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => {
      return searchParams.get(prop);
    },
  });
  token = params.token;
  userId = params.userId;

  const response = await fetch("api/v1/auth/verify-password-reset-token", {
    method: "POST",
    headers: {
      "Content-type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({
      token,
      userId,
    }),
  });

  if (!response.ok) {
    const { error } = await response.json();
    loader.innerText = error;
    return;
  }

  loader.style.display = "none";
  container.style.display = "block";
});

const displayError = (errorMessage) => {
  success.style.display = "none";
  error.innerText = errorMessage;
  error.style.display = "block";
};

const displaySuccess = (successMessage) => {
  error.style.display = "none";
  success.innerText = successMessage;
  success.style.display = "block";
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!password.value.trim()) {
    return displayError("Password is missing!");
  }
  if (!passwordRegex.test(password.value)) {
    return displayError(
      "Password is too simple, use alpha numeric with special characters!"
    );
  }
  if (password.value !== confirmPassword.value) {
    return displayError("Password do not match!");
  }

  button.disabled = true;
  button.innerText = "Please wait...";

  const response = await fetch("api/v1/auth/update-password", {
    method: "POST",
    headers: {
      "Content-type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({
      token,
      userId,
      password: password.value,
    }),
  });

  button.disabled = false;
  button.innerText = "Reset password";

  if (!response.ok) {
    const { error } = await response.json();
    return displayError(error);
  }

  displaySuccess("Password reseted");
  password.value = "";
  confirmPassword.value = "";
};

form.addEventListener("submit", handleSubmit);
