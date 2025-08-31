import { useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import styles from '../styles/ProfilePictureUploader.module.css';

export default function ProfilePictureUploader({ currentAvatarUrl, onAvatarUpdate, userId }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, JPEG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadAvatar(file);
  };

  const uploadAvatar = async (file) => {
    try {
      setUploading(true);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Get public URL manually (Supabase storage issue fix)
      // Extract project ref from Supabase URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fdddzfnawuykljrdrlrp.supabase.co';
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'fdddzfnawuykljrdrlrp';
      const publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/user-avatars/${filePath}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Call parent callback
      if (onAvatarUpdate) {
        onAvatarUpdate(publicUrl);
      }

      // Clear preview
      setPreviewUrl(null);

      alert('Profile picture updated successfully!');

    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeAvatar = async () => {
    if (!currentAvatarUrl) return;

    try {
      setUploading(true);

      // Remove avatar_url from profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Call parent callback
      if (onAvatarUpdate) {
        onAvatarUpdate(null);
      }

      alert('Profile picture removed successfully!');

    } catch (error) {
      console.error('Error removing avatar:', error);
      alert('Failed to remove profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const displayImage = previewUrl || currentAvatarUrl;

  return (
    <div className={styles.uploaderContainer}>
      {/* Current Avatar Display */}
      <div className={styles.avatarDisplay}>
        {displayImage ? (
          <img 
            src={displayImage} 
            alt="Profile" 
            className={styles.avatarImage}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            <span>👤</span>
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div 
        className={`${styles.uploadArea} ${dragActive ? styles.dragActive : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className={styles.uploadContent}>
          <div className={styles.uploadIcon}>📷</div>
          <p className={styles.uploadText}>
            {dragActive ? 'Drop image here' : 'Click or drag image here'}
          </p>
          <p className={styles.uploadSubtext}>
            PNG, JPG, JPEG, GIF up to 5MB
          </p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button
          className={styles.uploadButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Choose Image'}
        </button>

        {currentAvatarUrl && (
          <button
            className={styles.removeButton}
            onClick={removeAvatar}
            disabled={uploading}
          >
            Remove Picture
          </button>
        )}
      </div>

      {/* Upload Status */}
      {uploading && (
        <div className={styles.uploadStatus}>
          <div className={styles.spinner}></div>
          <span>Uploading...</span>
        </div>
      )}
    </div>
  );
}
