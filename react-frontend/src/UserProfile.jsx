import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import './forum.css';

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='32' fill='%23dbe4f0'/><circle cx='32' cy='24' r='12' fill='%23859bb5'/><path d='M14 54c3-10 11-16 18-16s15 6 18 16' fill='%23859bb5'/></svg>";

const UserProfile = () => {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [loggedInUser, setLoggedInUser] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setLoggedInUser(data.username);
      });
  }, []);

  useEffect(() => {
    fetch(`http://localhost:3001/users/${username}/profile`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.profile);
          const url = data.profile.avatar
            ? `${data.profile.avatar}?t=${Date.now()}`
            : DEFAULT_AVATAR;
          setAvatarUrl(url);
        }
      });
  }, [username]);

  useEffect(() => {
    if (location.hash === '#liked') {
      setActiveTab('liked');
    } else {
      setActiveTab('posts');
    }
  }, [location]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadStatus('');

    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      const res = await fetch('http://localhost:3001/upload-avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await res.json();
      console.log(data);
      if (data.success && data.imageUrl) {
        const updatedUrl = `${data.imageUrl}?t=${Date.now()}`;
        setAvatarUrl(updatedUrl);
        setProfile(prev => ({ ...prev, avatar: data.imageUrl }));
        setSelectedFile(null);
        setUploadStatus('success');
      } else {
        setUploadStatus('error');
      }
    } catch (err) {
      setUploadStatus('error');
    }

    setUploading(false);
    setTimeout(() => setUploadStatus(''), 3000);
  };

  const renderPosts = (list) =>
    list.map((post) => (
      <div key={post.id} className="post-card">
        <div className="post-header">
          <strong>{post.username}</strong>
          <span className="post-time">• {new Date(post.createdAt).toLocaleString()}</span>
        </div>
        <div className="post-content">{post.content}</div>
        <div className="post-footer">
          <button className="like-btn">❤️ {post.likes}</button>
        </div>
        {post.likers && post.likers.length > 0 && (
          <div className="post-likers">
            <span>Liked by: {post.likers.join(', ')}</span>
          </div>
        )}
      </div>
    ));

  if (!profile) return <div>Loading profile...</div>;

  const isOwnProfile = loggedInUser === profile.username;

  return (
    <div className="forum-container">
      <div className="dashboard-header" style={{ paddingBottom: '0' }}>
        <div className="top-bar" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={avatarUrl}
              alt="avatar"
              onError={() => setAvatarUrl(DEFAULT_AVATAR)}
              style={{ width: '48px', height: '48px', borderRadius: '50%' }}
            />
            <span className="greeting">👤 {profile.username}'s Profile</span>
          </div>
          <Link to="/forum">
            <button className="logout-btn">← Back to Forum</button>
          </Link>
        </div>

        {isOwnProfile && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="file" onChange={handleFileChange} />
              <button
                className={`post-btn ${uploading ? 'disabled' : ''}`}
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  backgroundColor: uploading ? '#ccc' : '#007bff',
                  color: uploading ? '#666' : 'white',
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? 'Uploading...' : '📤 Upload Avatar'}
              </button>
            </div>

            {uploadStatus === 'success' && (
              <div style={{ color: 'green' }}>✅ Avatar uploaded successfully!</div>
            )}
            {uploadStatus === 'error' && (
              <div style={{ color: 'red' }}>❌ Failed to upload avatar.</div>
            )}
          </div>
        )}

        <div className="tab-buttons" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button
            className={`post-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('posts');
              navigate(`#posts`);
            }}
          >
            📝 Posts
          </button>
          <button
            className={`post-btn ${activeTab === 'liked' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('liked');
              navigate(`#liked`);
            }}
          >
            ❤️ Liked
          </button>
        </div>
      </div>

      <div className="post-list" style={{ paddingTop: '20px' }}>
        {activeTab === 'posts'
          ? renderPosts(profile.posts)
          : renderPosts(profile.likedPosts)}
      </div>
    </div>
  );
};

export default UserProfile;
