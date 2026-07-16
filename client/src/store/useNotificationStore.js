import toast from "react-hot-toast";

export function notify({ message, type = "info" }) {
  if (type === "success") {
    toast.success(message);
  } else if (type === "error") {
    toast.error(message);
  } else {
    toast(message);
  }
}
