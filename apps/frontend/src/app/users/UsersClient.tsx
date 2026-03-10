"use client";

import { useState } from "react";
import {
  UserPlus,
  Users,
  Mail,
  User,
  Lock,
  CheckCircle,
  AlertCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { LogoCompact } from "@/components/Logo";
import { useUserStore } from "@/store/useUserStore";
import type { UserSchema } from "@/types/schema";

type UsersClientProps = {
  users: UserSchema[];
};

type EditTechnicianModalProps = {
  user: UserSchema;
  onCancel: () => void;
  onSave: (updatedUser: UserSchema) => void;
};

const getMessageClass = (type: "success" | "error") => {
  if (type === "success") {
    return "qc-users-message qc-users-message-success";
  }

  return "qc-users-message qc-users-message-error";
};

const getMessageIconClass = (type: "success" | "error") => {
  if (type === "success") {
    return "qc-users-message-icon qc-users-message-icon-success";
  }

  return "qc-users-message-icon qc-users-message-icon-error";
};

const getMessageTextClass = (type: "success" | "error") => {
  if (type === "success") {
    return "qc-users-message-text qc-users-message-text-success";
  }

  return "qc-users-message-text qc-users-message-text-error";
};

const getTechnicianStatusDotClass = (isActive: boolean) => {
  if (isActive) {
    return "qc-users-tech-status-dot qc-users-tech-status-dot-active";
  }

  return "qc-users-tech-status-dot qc-users-tech-status-dot-inactive";
};

function EditTechnicianModal({ user, onCancel, onSave }: EditTechnicianModalProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email ?? "");
  const [username, setUsername] = useState(user.username);
  const [profileImage, setProfileImage] = useState(user.profileImage ?? "");

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...user,
      fullName,
      email,
      username,
      profileImage,
    });
  };

  return (
    <div className="qc-users-modal-overlay">
      <div className="qc-users-modal-card">
        <h2 className="qc-users-modal-title">Edit Technician</h2>
        <form onSubmit={handleSubmit} className="qc-users-form-layout">
          <div className="qc-users-field-group">
            <label className="qc-users-field-label">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="qc-users-field-input"
              required
            />
          </div>

          <div className="qc-users-field-group">
            <label className="qc-users-field-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="qc-users-field-input"
            />
          </div>

          <div className="qc-users-field-group">
            <label className="qc-users-field-label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="qc-users-field-input"
              required
            />
          </div>

          <div className="qc-users-field-group">
            <label className="qc-users-field-label">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="qc-users-file-input"
            />
            {profileImage && (
              <div className="qc-users-preview-wrap">
                <Image
                  src={profileImage}
                  alt="Technician profile preview"
                  width={56}
                  height={56}
                  unoptimized
                  className="qc-users-preview-avatar"
                />
              </div>
            )}
          </div>

          <div className="qc-users-modal-actions">
            <button type="button" onClick={onCancel} className="qc-users-button-secondary">
              Cancel
            </button>
            <button type="submit" className="qc-users-button-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const getLastActiveLabel = (lastActiveAt?: string) => {
  if (!lastActiveAt) {
    return "Last active unknown";
  }

  const lastActiveDate = new Date(lastActiveAt);
  const now = new Date();
  const diffMs = now.getTime() - lastActiveDate.getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.floor(diffMs / dayMs));

  if (days < 7) {
    return `Last active ${days} day${days === 1 ? "" : "s"} ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `Last active ${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `Last active ${months} month${months === 1 ? "" : "s"} ago`;
  }

  const years = Math.floor(days / 365);
  return `Last active ${years} year${years === 1 ? "" : "s"} ago`;
};

export default function UsersClient({ users }: UsersClientProps) {
  const { addDoctor, currentUser } = useAuth();
  const usersList = useUserStore((state) => state.usersList);
  const updateUser = useUserStore((state) => state.updateUser);
  const deleteUser = useUserStore((state) => state.deleteUser);
  const effectiveUsers = usersList.length > 0 ? usersList : users;
  const isAdmin = currentUser?.role === "admin";
  const [editingUser, setEditingUser] = useState<UserSchema | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    profileImage: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const handleEditUser = (user: UserSchema) => {
    setEditingUser(user);
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm("Are you sure you want to delete this technician?")) {
      deleteUser(id);
    }
  };

  const handleSaveEdit = (updatedUser: UserSchema) => {
    updateUser(updatedUser);
    setEditingUser(null);
  };

  if (!isAdmin) {
    return (
      <div className="qc-users-page">
        <div className="qc-users-access-head">
          <h1 className="qc-users-access-title">Access Denied</h1>
        </div>
        <div className="qc-users-access-card">
          <AlertCircle size={48} className="qc-users-access-icon" />
          <p className="qc-users-access-text">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.username || !formData.password || !formData.fullName) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    if (formData.username.length < 3) {
      setMessage({ type: "error", text: "Username must be at least 3 characters" });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    const success = addDoctor(
      formData.username,
      formData.password,
      formData.fullName,
      formData.email,
      formData.profileImage,
    );

    if (success) {
      setMessage({
        type: "success",
        text: `Technician account created successfully for ${formData.fullName}`,
      });
      setFormData({ username: "", password: "", fullName: "", email: "", profileImage: "" });
      setShowAddForm(false);
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({
        type: "error",
        text: "Username already exists. Please choose a different username.",
      });
    }
  };

  const technicians = effectiveUsers.filter((u) => u.role === "doctor");

  return (
    <div className="qc-users-page">
      <div className="qc-users-header-row">
        <div />
        <div className="qc-users-mobile-logo-wrap">
          <LogoCompact />
        </div>
      </div>

      <div className="qc-users-header-accent" />

      {message && (
        <div className={getMessageClass(message.type)}>
          {message.type === "success" ? (
            <CheckCircle size={20} className={getMessageIconClass(message.type)} />
          ) : (
            <AlertCircle size={20} className={getMessageIconClass(message.type)} />
          )}
          <p className={getMessageTextClass(message.type)}>{message.text}</p>
        </div>
      )}

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="qc-users-add-button"
      >
        <UserPlus size={20} className="qc-users-button-icon" />
        {showAddForm ? "Cancel" : "Add New Technician"}
      </button>

      {showAddForm && (
        <div className="qc-users-main-card qc-users-add-card">
          <h2 className="qc-users-section-title">Create New Technician Account</h2>
          <form onSubmit={handleSubmit} className="qc-users-form-layout">
            <div className="qc-users-field-group">
              <label className="qc-users-field-label">Full Name *</label>
              <div className="qc-users-input-wrap">
                <User className="qc-users-input-icon" size={18} />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="qc-users-field-input qc-users-field-input-with-icon"
                  placeholder="Dr. John Doe"
                />
              </div>
            </div>

            <div className="qc-users-field-group">
              <label className="qc-users-field-label">Email</label>
              <div className="qc-users-input-wrap">
                <Mail className="qc-users-input-icon" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="qc-users-field-input qc-users-field-input-with-icon"
                  placeholder="technician@myghc.eg"
                />
              </div>
            </div>

            <div className="qc-users-field-group">
              <label className="qc-users-field-label">Username *</label>
              <div className="qc-users-input-wrap">
                <User className="qc-users-input-icon" size={18} />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="qc-users-field-input qc-users-field-input-with-icon"
                  placeholder="johndoe"
                />
              </div>
            </div>

            <div className="qc-users-field-group">
              <label className="qc-users-field-label">Password *</label>
              <div className="qc-users-input-wrap">
                <Lock className="qc-users-input-icon" size={18} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="qc-users-field-input qc-users-field-input-with-icon"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            <div className="qc-users-field-group">
              <label className="qc-users-field-label">Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") {
                      setFormData((prev) => ({ ...prev, profileImage: reader.result as string }));
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                className="qc-users-file-input"
              />
              {formData.profileImage && (
                <div className="qc-users-preview-wrap">
                  <Image
                    src={formData.profileImage}
                    alt="New technician profile preview"
                    width={56}
                    height={56}
                    unoptimized
                    className="qc-users-preview-avatar"
                  />
                </div>
              )}
            </div>

            <button type="submit" className="qc-users-submit-button">
              <CheckCircle size={18} className="qc-users-button-icon" />
              Create Technician Account
            </button>
          </form>
        </div>
      )}

      <div className="qc-users-main-card qc-users-list-card">
        <div className="qc-users-list-header">
          <div className="qc-users-list-title-wrap">
            <Users size={24} className="qc-users-list-title-icon" />
            <h2 className="qc-users-section-title">Technician Accounts</h2>
          </div>
          <span className="qc-users-count-badge">
            {technicians.length} {technicians.length === 1 ? "technician" : "technicians"}
          </span>
        </div>

        <div className="qc-users-tech-list">
          {technicians.map((technician) => (
            <div key={technician.username} className="qc-users-tech-card">
              <div className="qc-users-tech-row">
                {technician.profileImage ? (
                  <Image
                    src={technician.profileImage}
                    alt={`${technician.fullName} profile`}
                    width={48}
                    height={48}
                    unoptimized
                    className="qc-users-tech-avatar-image"
                  />
                ) : (
                  <div className="qc-users-tech-avatar-fallback">
                    {technician.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                )}

                <div className="qc-users-tech-content">
                  <div className="qc-users-tech-head">
                    <div>
                      <h3 className="qc-users-tech-name">{technician.fullName}</h3>
                      <div className="qc-users-tech-status-row">
                        <span className={getTechnicianStatusDotClass(technician.isActive ?? false)} />
                        <span className="qc-users-tech-status-text">
                          {technician.isActive ?? false ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="qc-users-tech-actions">
                        <button
                          type="button"
                          onClick={() => handleEditUser(technician)}
                          className="qc-users-action-button qc-users-action-button-edit"
                        >
                          <Pencil size={14} className="qc-users-action-icon" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(technician.id)}
                          className="qc-users-action-button qc-users-action-button-delete"
                        >
                          <Trash2 size={14} className="qc-users-action-icon" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="qc-users-tech-meta-list">
                    <p className="qc-users-tech-meta-text">
                      <span className="qc-users-tech-meta-label">Username:</span> {technician.username}
                    </p>
                    {technician.email && (
                      <p className="qc-users-tech-meta-text">
                        <span className="qc-users-tech-meta-label">Email:</span> {technician.email}
                      </p>
                    )}
                    <p className="qc-users-tech-meta-text">
                      <span className="qc-users-tech-meta-label">
                        {getLastActiveLabel(technician.lastActiveAt)}
                      </span>
                    </p>
                  </div>

                  <span className="qc-users-tech-role-badge">Technician</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="qc-users-admin-card">
        <div className="qc-users-admin-row">
          {currentUser?.profileImage ? (
            <Image
              src={currentUser.profileImage}
              alt={`${currentUser.fullName} profile`}
              width={56}
              height={56}
              unoptimized
              className="qc-users-admin-avatar-image"
            />
          ) : (
            <div className="qc-users-admin-avatar-fallback">
              {currentUser?.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
          )}

          <div className="qc-users-admin-content">
            <h3 className="qc-users-admin-name">{currentUser?.fullName}</h3>
            <p className="qc-users-admin-text">
              <span className="qc-users-admin-label">Username:</span> {currentUser?.username}
            </p>
            {currentUser?.email && (
              <p className="qc-users-admin-text">
                <span className="qc-users-admin-label">Email:</span> {currentUser.email}
              </p>
            )}
            <span className="qc-users-admin-role-badge">Administrator</span>
          </div>
        </div>
      </div>

      {editingUser && (
        <EditTechnicianModal
          user={editingUser}
          onCancel={() => setEditingUser(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
