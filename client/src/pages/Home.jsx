import { useEffect, useState } from "react";
import api from "../api/client.js";

export default function Home() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    api
      .get("/health")
      .then((res) => setStatus(res.data.status))
      .catch(() => setStatus("offline"));
  }, []);

  return (
    <section>
      <h1>SemesterSync</h1>
      <p>Your timetable, date sheets and deadlines in one calendar.</p>
      <p className="status">API status: {status}</p>
    </section>
  );
}
