import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Save, Lock, User, FileText, UploadCloud, Check, X, Loader2, Image as ImageIcon } from 'lucide-react';

export const EditProfile: React.FC = () => {
  const { profile, refreshData } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (profile) { setName(profile.name || ''); setBio(profile.bio || ''); setAvatarPreview(profile.avatar); } }, [profile]);

  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.type === 'dragenter' || e.type === 'dragover') { setDragActive(true); } else if (e.type === 'dragleave') { setDragActive(false); } };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) { handleFile(e.dataTransfer.files[0]); } };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { handleFile(e.target.files[0]); } };
  const handleFile = (file: File) => { if (!file.type.startsWith('image/')) { setMessage({ type: 'error', text: 'Please upload an image file.' }); return; } setAvatarFile(file); const reader = new FileReader(); reader.onload = (e) => setAvatarPreview(e.target?.result as string); reader.readAsDataURL(file); };

  const uploadToImgBB = async (file: File): Promise<string | null> => {
      const formData = new FormData(); formData.append('image', file); formData.append('key', '268fefe5f388127c19081b2e6d9dab74'); formData.append('name', `${profile?.id}_${Date.now()}`); formData.append('expiration', '0');
      try { const interval = setInterval(() => { setUploadProgress(prev => Math.min(prev + 10, 90)); }, 200); const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData }); clearInterval(interval); setUploadProgress(100); const data = await res.json(); if (data.success) { return data.data.url; } else { throw new Error('ImgBB Upload Failed'); } } catch (error) { console.error("Upload error:", error); return null; }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault(); setLoading(true); setMessage(null); setUploadProgress(0);
      try {
          let avatarUrl = profile?.avatar;
          if (avatarFile) { const uploadedUrl = await uploadToImgBB(avatarFile); if (uploadedUrl) { avatarUrl = uploadedUrl; } else { throw new Error("Failed to upload image. Please try again."); } }
          const updates: any = { name, avatar: avatarUrl, bio: bio };
          const { error: profileError } = await supabase.from('profiles').update(updates).eq('id', profile?.id);
          if (profileError) throw profileError;
          if (changePassword && newPassword) { if (newPassword !== confirmPassword) { throw new Error("Passwords do not match."); } if (newPassword.length < 6) { throw new Error("Password must be at least 6 characters."); } const { error: authError } = await supabase.auth.updateUser({ password: newPassword }); if (authError) throw authError; }
          setMessage({ type: 'success', text: 'Profile updated successfully!' }); await refreshData(); setTimeout(() => { navigate('/profile'); }, 1500);
      } catch (err: any) { setMessage({ type: 'error', text: err.message || 'An unexpected error occurred.' }); } finally { setLoading(false); setUploadProgress(0); }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-24 md:pb-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-4 md:mb-6"><button onClick={() => navigate('/profile')} className="p-2 bg-surface rounded-xl border border-border text-secondary hover:text-primary transition-colors"><ArrowLeft size={20} /></button><h2 className="text-xl md:text-2xl font-bold text-primary">Edit Profile</h2></div>
        {message && (<div className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>{message.type === 'success' ? <Check size={20} /> : <X size={20} />}<p className="text-sm font-medium">{message.text}</p></div>)}
        <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-surface rounded-3xl border border-border p-5 md:p-6"><h3 className="text-primary font-bold mb-4 flex items-center gap-2 text-sm md:text-base"><ImageIcon size={16} className="text-indigo-400" />Profile Picture</h3><div className="flex flex-col sm:flex-row items-center gap-6"><div className="relative group shrink-0"><div className="w-24 h-24 md:w-28 md:h-28 rounded-full p-1 bg-gradient-to-br from-indigo-500 to-purple-600"><img src={avatarPreview || `https://ui-avatars.com/api/?name=${name || 'User'}&background=random`} alt="Preview" className="w-full h-full rounded-full object-cover border-4 border-surface bg-background" /></div>{loading && uploadProgress > 0 && uploadProgress < 100 && (<div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"><span className="text-white text-xs font-bold">{uploadProgress}%</span></div>)}</div><div className={`flex-1 w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-500 hover:border-gray-400 hover:bg-primary/5'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}><input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} /><UploadCloud size={28} className={`mb-2 ${dragActive ? 'text-indigo-400' : 'text-secondary'}`} /><p className="text-sm text-primary font-medium">Click to upload or drag & drop</p><p className="text-[10px] text-secondary mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p></div></div></div>
            <div className="bg-surface rounded-3xl border border-border p-5 md:p-6 space-y-4"><h3 className="text-primary font-bold flex items-center gap-2 text-sm md:text-base"><User size={16} className="text-indigo-400" />Personal Details</h3><div><label className="block text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Display Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-indigo-500 transition-colors text-sm" placeholder="Your name" /></div><div><label className="block text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none text-sm" placeholder="Tell us a bit about yourself..." /></div></div>
            <div className="bg-surface rounded-3xl border border-border p-5 md:p-6 space-y-4"><div className="flex items-center justify-between"><h3 className="text-primary font-bold flex items-center gap-2 text-sm md:text-base"><Lock size={16} className="text-indigo-400" />Security</h3><div className="flex items-center"><input type="checkbox" id="changePass" checked={changePassword} onChange={(e) => setChangePassword(e.target.checked)} className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-background" /><label htmlFor="changePass" className="ml-2 text-xs md:text-sm text-primary cursor-pointer select-none">Change Password</label></div></div>{changePassword && (<div className="space-y-3 animate-fade-in"><div><label className="block text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-indigo-500 transition-colors text-sm" placeholder="Min. 6 characters" /></div><div><label className="block text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Confirm Password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-background border border-border rounded-xl p-3 text-primary focus:outline-none focus:border-indigo-500 transition-colors text-sm" placeholder="Re-enter password" /></div></div>)}</div>
            <div className="flex gap-3 pt-2"><button type="button" onClick={() => navigate('/profile')} className="flex-1 bg-surface border border-border text-secondary font-bold py-3.5 rounded-2xl hover:bg-primary/5 transition-colors text-sm">Cancel</button><button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm">{loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save Changes</>}</button></div>
        </form>
    </div>
  );
};