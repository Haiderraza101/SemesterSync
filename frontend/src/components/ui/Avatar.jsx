import { API_BASE_URL } from "../../config.js";
import { cx } from "../../utils/cx.js";

export function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function avatarUrl(avatar) {
  return avatar ? `${API_BASE_URL}/users/avatars/${avatar}` : null;
}

export default function Avatar({ name, avatar, src, size = 32, className }) {
  const image = src || avatarUrl(avatar);
  return (
    <span
      className={cx("avatar", image && "avatar--image", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {image ? <img src={image} alt="" className="avatar__img" /> : getInitials(name) || "?"}
    </span>
  );
}
