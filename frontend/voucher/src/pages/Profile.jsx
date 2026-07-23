import { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "",
  });

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/user/getUser", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setForm({
        name: res.data.name,
        phone: res.data.phone || "",
        age: res.data.age,
        gender: res.data.gender,
      });
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  // ✅ useEffect لضمان استدعاء fetchProfile عند تحميل الصفحة
  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put("http://localhost:5000/api/user/updateUser", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(res.data.message);
      setUser(res.data.user);
    } catch (err) {
      console.log(err.response?.data || err.message);
      alert("Failed to update profile!");
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="profile-container">
      <h2>My Profile</h2>
      <form onSubmit={handleSubmit} className="profile-form">
        <label>Name</label>
        <input type="text" name="name" value={form.name} onChange={handleChange} required />

        <label>Phone</label>
        <input type="text" name="phone" value={form.phone} onChange={handleChange} />

        <label>Age</label>
        <input type="number" name="age" value={form.age} onChange={handleChange} required disabled />

        <label>Gender</label>
        <select name="gender" value={form.gender} onChange={handleChange} required disabled>
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
}
