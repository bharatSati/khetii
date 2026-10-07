import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Heart,
  Share2,
  PlusCircle,
  MapPin,
  Send,
  Trash2,
  Sparkles,
  Filter,
  CheckCircle,
  X,
  AlertCircle,
  Compass,
  Radio,
  Camera,
  Image as ImageIcon,
  UploadCloud
} from 'lucide-react';
import samvaadService from '../services/samvaadService';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import TTSButton from '../components/TTSButton';

export const Samvaad = () => {
  const { user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language?.startsWith('hi') ? 'hi' : 'en';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radiusKm, setRadiusKm] = useState(5); // default 5 km as requested
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('closest');
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});
  const [toastMessage, setToastMessage] = useState('');

  // Modal for new post
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [creatingPost, setCreatingPost] = useState(false);
  const [createError, setCreateError] = useState('');

  // Image upload state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  const userLat = user?.latitude ?? 28.6139;
  const userLon = user?.longitude ?? 77.2090;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await samvaadService.getPosts({
        lat: userLat,
        lon: userLon,
        radiusKm,
        category,
        sort
      });
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [radiusKm, category, sort, userLat, userLon]);

  // Handle Like Toggle
  const handleLike = async (postId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Optimistic UI update
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p._id === postId) {
          const willLike = !p.isLikedByMe;
          return {
            ...p,
            isLikedByMe: willLike,
            likeCount: willLike ? p.likeCount + 1 : Math.max(0, p.likeCount - 1)
          };
        }
        return p;
      })
    );

    try {
      const res = await samvaadService.toggleLike(postId);
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p._id === postId ? { ...p, isLikedByMe: res.isLiked, likeCount: res.likeCount } : p
        )
      );
    } catch (err) {
      console.error('Like error:', err);
      // Revert if error
      fetchPosts();
    }
  };

  // Toggle Comment Thread
  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Handle Add Comment
  const handleAddComment = async (postId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await samvaadService.addComment(postId, text);
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p._id === postId) {
            return {
              ...p,
              comments: res.comments,
              commentCount: res.commentCount
            };
          }
          return p;
        })
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      showToast(lang === 'hi' ? 'टिप्पणी साझा की गई!' : 'Comment posted!');
    } catch (err) {
      console.error('Add comment error:', err);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Handle Share Post
  const handleShare = async (post) => {
    const shareUrl = `${window.location.origin}/samvaad?post=${post._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || 'खेती स्थानीय संवाद चर्चा',
          text: post.content.substring(0, 100) + '...',
          url: shareUrl
        });
      } catch (e) {
        // Fallback to clipboard
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }

    // Call backend to increment share count
    try {
      const res = await samvaadService.sharePost(post._id);
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p._id === post._id ? { ...p, shares: res.shares } : p))
      );
    } catch (e) {
      // ignore
    }

    showToast(t('samvaad.sharedToast'));
  };

  // Handle Delete Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm(t('samvaad.deletePostConfirm'))) return;

    try {
      await samvaadService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      showToast(lang === 'hi' ? 'पोस्ट हटा दी गई' : 'Post deleted');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Could not delete post.');
    }
  };

  // Image selection handlers
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setCreateError(lang === 'hi' ? 'फोटो का आकार 5MB से कम होना चाहिए' : 'Image size must be under 5MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setCreateError('');
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) {
      setCreateError(lang === 'hi' ? 'कृपया अपनी पोस्ट का विवरण लिखें' : 'Please enter post content');
      return;
    }

    setCreatingPost(true);
    setCreateError('');

    try {
      const formData = new FormData();
      formData.append('title', newTitle.trim());
      formData.append('content', newContent.trim());
      formData.append('category', newCategory);
      formData.append('lat', userLat);
      formData.append('lon', userLon);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const res = await samvaadService.createPost(formData);

      setPosts((prev) => [res.post, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      setNewCategory('general');
      removeSelectedImage();
      showToast(lang === 'hi' ? 'आपकी पोस्ट 5 किमी दायरे में साझा हो गई है!' : 'Published within 5 km radius!');
    } catch (err) {
      console.error('Create post error:', err);
      setCreateError(err.response?.data?.message || 'Failed to publish post');
    } finally {
      setCreatingPost(false);
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'crops':
        return { label: lang === 'hi' ? '🌾 फसल व खेती' : '🌾 Crops', bg: 'var(--nb-green-light)' };
      case 'equipment':
        return { label: lang === 'hi' ? '🚜 मशीनरी साझा' : '🚜 Equipment', bg: 'var(--nb-yellow-light)' };
      case 'weather_alert':
        return { label: lang === 'hi' ? '🌦️ मौसम अलर्ट' : '🌦️ Weather Alert', bg: 'var(--nb-blue-light)' };
      case 'pest_help':
        return { label: lang === 'hi' ? '🐛 कीट व रोग' : '🐛 Pest Help', bg: 'var(--nb-red-light)' };
      case 'market_advice':
        return { label: lang === 'hi' ? '📈 मंडी भाव' : '📈 Mandi Advice', bg: 'var(--nb-orange-light)' };
      default:
        return { label: lang === 'hi' ? '💬 सामान्य चर्चा' : '💬 General', bg: 'var(--nb-purple-light)' };
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: 'var(--space-2xl)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--nb-black)',
            color: 'var(--nb-white)',
            border: '2px solid #000',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            padding: '12px 20px',
            fontWeight: '800',
            fontSize: '0.92rem',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle size={18} style={{ color: 'var(--nb-green-bright)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Hero / Header Card */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--nb-green-light)',
          border: 'var(--border-thick)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          padding: 'var(--space-xl)',
          marginBottom: 'var(--space-xl)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.2rem' }}>📡</span>
              <span
                style={{
                  padding: '2px 8px',
                  backgroundColor: 'var(--nb-yellow)',
                  border: '1.5px solid var(--nb-black)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: '900',
                  textTransform: 'uppercase'
                }}
              >
                {t('samvaad.radiusBadge', { radius: radiusKm })}
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--nb-black)', letterSpacing: '-0.5px' }}>
              {t('samvaad.title')} 🌾
            </h1>
            <p style={{ fontWeight: '700', color: '#1f2937', marginTop: '6px', fontSize: '1rem', maxWidth: '650px', lineHeight: 1.45 }}>
              {t('samvaad.subtitle')}
            </p>

            {/* User GPS coordinates info */}
            <div
              style={{
                marginTop: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: 'var(--nb-white)',
                border: 'var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-sm)',
                fontSize: '0.85rem',
                fontWeight: '800'
              }}
            >
              <MapPin size={16} strokeWidth={2.5} style={{ color: '#dc2626' }} />
              <span>
                {user?.district || user?.city || 'New Delhi'}, {user?.state || 'Delhi'}
              </span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                ({userLat.toFixed(3)}°N, {userLon.toFixed(3)}°E)
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
              } else {
                setShowCreateModal(true);
              }
            }}
            className="btn btn-primary"
            style={{
              padding: '12px 20px',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <PlusCircle size={20} strokeWidth={2.5} />
            <span>{t('samvaad.newPost')}</span>
          </button>
        </div>

        {/* Radius Selector Pills */}
        <div
          style={{
            marginTop: 'var(--space-lg)',
            paddingTop: 'var(--space-md)',
            borderTop: 'var(--border-thin)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--nb-black)' }}>
            दायरा (Radius):
          </span>
          {[5, 10, 20].map((r) => (
            <button
              key={r}
              onClick={() => setRadiusKm(r)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'var(--border-medium)',
                fontWeight: '900',
                fontSize: '0.85rem',
                cursor: 'pointer',
                backgroundColor: radiusKm === r ? 'var(--nb-black)' : 'var(--nb-white)',
                color: radiusKm === r ? 'var(--nb-white)' : 'var(--nb-black)',
                boxShadow: radiusKm === r ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.1s ease'
              }}
            >
              {r} km {r === 5 ? '(डिफ़ॉल्ट)' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div
        className="card"
        style={{
          border: 'var(--border-thick)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          backgroundColor: 'var(--nb-white)',
          padding: '14px 18px',
          marginBottom: 'var(--space-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { id: 'all', label: t('samvaad.categoryAll') },
            { id: 'crops', label: lang === 'hi' ? '🌾 फसलें' : '🌾 Crops' },
            { id: 'equipment', label: lang === 'hi' ? '🚜 मशीनरी' : '🚜 Equipment' },
            { id: 'weather_alert', label: lang === 'hi' ? '🌦️ मौसम अलर्ट' : '🌦️ Weather' },
            { id: 'pest_help', label: lang === 'hi' ? '🐛 कीट रोकथाम' : '🐛 Pest Help' },
            { id: 'general', label: lang === 'hi' ? '💬 सामान्य' : '💬 General' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--nb-black)',
                fontWeight: '800',
                fontSize: '0.82rem',
                cursor: 'pointer',
                backgroundColor: category === cat.id ? 'var(--nb-yellow)' : 'var(--nb-canvas-alt)',
                color: 'var(--nb-black)',
                boxShadow: category === cat.id ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--color-text-secondary)' }}>
            क्रम (Sort):
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: 'var(--border-medium)',
              fontWeight: '800',
              fontSize: '0.85rem',
              backgroundColor: 'var(--nb-white)',
              color: 'var(--nb-black)',
              cursor: 'pointer'
            }}
          >
            <option value="closest">{t('samvaad.sortClosest')}</option>
            <option value="recent">{t('samvaad.sortRecent')}</option>
          </select>
        </div>
      </div>

      {/* 3. Posts Stream */}
      {loading ? (
        <Loader message={lang === 'hi' ? '5 किमी के दायरे से संवाद लोड हो रहा है...' : 'Fetching posts within 5 km...'} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Radio}
          title={t('samvaad.noPostsTitle')}
          description={t('samvaad.noPostsDesc')}
          actionText={t('samvaad.newPost')}
          onAction={() => {
            if (!isAuthenticated) navigate('/login');
            else setShowCreateModal(true);
          }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {posts.map((post) => {
            const catBadge = getCategoryBadge(post.category);
            const isCommentsOpen = !!expandedComments[post._id];

            return (
              <article
                key={post._id}
                className="card"
                style={{
                  border: 'var(--border-thick)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  backgroundColor: 'var(--nb-white)',
                  padding: 'var(--space-lg)',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Post Top Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--nb-yellow-light)',
                        border: 'var(--border-medium)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '900',
                        fontSize: '1.1rem',
                        color: 'var(--nb-black)',
                        flexShrink: 0
                      }}
                    >
                      {post.authorName ? post.authorName.charAt(0).toUpperCase() : '🌾'}
                    </div>
                    <div>
                      <div style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--nb-black)' }}>
                        {post.authorName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        <MapPin size={13} strokeWidth={2.5} style={{ color: '#ef4444' }} />
                        <span>
                          {post.authorLocation?.district || post.authorLocation?.city || 'Delhi'}
                        </span>
                        <span>•</span>
                        <span>{new Date(post.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Distance Pill */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        backgroundColor: post.distanceKm <= 5 ? 'var(--nb-green-light)' : 'var(--nb-yellow-light)',
                        border: '1.5px solid var(--nb-black)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: '900',
                        color: 'var(--nb-black)'
                      }}
                    >
                      <Compass size={12} strokeWidth={2.5} />
                      {t('samvaad.distanceAway', { distance: post.distanceKm })}
                    </span>

                    {/* Category Pill */}
                    <span
                      style={{
                        padding: '4px 8px',
                        backgroundColor: catBadge.bg,
                        border: '1.5px solid var(--nb-black)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: '800'
                      }}
                    >
                      {catBadge.label}
                    </span>

                    <TTSButton
                      text={[post.title, post.content]}
                      variant="icon-only"
                      size="sm"
                      title={lang === 'hi' ? 'पोस्ट सुनें' : 'Listen Post'}
                    />

                    {/* Delete button if author */}
                    {post.isAuthor && (
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 6px', color: '#dc2626' }}
                        title="Delete post"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Title */}
                {post.title && (
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: '900',
                      color: 'var(--nb-black)',
                      marginBottom: '8px',
                      lineHeight: 1.35
                    }}
                  >
                    {post.title}
                  </h3>
                )}

                {/* Post Body Content */}
                <p
                  style={{
                    fontSize: '0.96rem',
                    fontWeight: '600',
                    lineHeight: 1.6,
                    color: '#1f2937',
                    marginBottom: '16px',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {post.content}
                </p>

                {/* Post Attached Image (Cloudinary) */}
                {post.imageUrl && (
                  <div
                    style={{
                      marginBottom: '16px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: 'var(--border-medium)',
                      boxShadow: 'var(--shadow-sm)',
                      backgroundColor: 'var(--nb-canvas-alt)'
                    }}
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.title || 'Samvaad post'}
                      style={{
                        width: '100%',
                        maxHeight: '380px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Post Action Buttons (Like, Discuss/Comment, Share) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingTop: '12px',
                    borderTop: 'var(--border-thin)',
                    flexWrap: 'wrap'
                  }}
                >
                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(post._id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'var(--border-medium)',
                      backgroundColor: post.isLikedByMe ? '#fee2e2' : 'var(--nb-canvas-alt)',
                      color: post.isLikedByMe ? '#dc2626' : 'var(--nb-black)',
                      fontWeight: '800',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                      boxShadow: post.isLikedByMe ? 'var(--shadow-sm)' : 'none'
                    }}
                  >
                    <Heart
                      size={18}
                      strokeWidth={2.5}
                      fill={post.isLikedByMe ? '#dc2626' : 'none'}
                    />
                    <span>{post.likeCount || 0}</span>
                  </button>

                  {/* Comment / Discuss Button */}
                  <button
                    onClick={() => toggleComments(post._id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'var(--border-medium)',
                      backgroundColor: isCommentsOpen ? 'var(--nb-yellow-light)' : 'var(--nb-canvas-alt)',
                      color: 'var(--nb-black)',
                      fontWeight: '800',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                      boxShadow: isCommentsOpen ? 'var(--shadow-sm)' : 'none'
                    }}
                  >
                    <MessageSquare size={18} strokeWidth={2.5} />
                    <span>
                      {post.commentCount || 0} {lang === 'hi' ? 'टिप्पणियां' : 'Discuss'}
                    </span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShare(post)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'var(--border-medium)',
                      backgroundColor: 'var(--nb-canvas-alt)',
                      color: 'var(--nb-black)',
                      fontWeight: '800',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    <Share2 size={18} strokeWidth={2.5} />
                    <span>{post.shares ? `${post.shares} शेयर` : t('samvaad.share')}</span>
                  </button>
                </div>

                {/* 4. Discussion / Comments Thread Drawer */}
                {isCommentsOpen && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '14px',
                      backgroundColor: 'var(--nb-canvas-alt)',
                      border: 'var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <h4
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: '900',
                        color: 'var(--nb-black)',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {t('samvaad.comments')} ({post.comments?.length || 0}) 💬
                    </h4>

                    {/* Comment list */}
                    {post.comments && post.comments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                        {post.comments.map((comm) => (
                          <div
                            key={comm._id}
                            style={{
                              padding: '10px 12px',
                              backgroundColor: 'var(--nb-white)',
                              border: '1.5px solid var(--nb-black)',
                              borderRadius: 'var(--radius-sm)',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--nb-black)' }}>
                                {comm.userName}{' '}
                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>
                                  ({comm.userLocation || 'किसान साथी'})
                                </span>
                              </div>
                              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-text-muted)' }}>
                                {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937' }}>
                              {comm.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                        {lang === 'hi' ? 'अभी कोई टिप्पणी नहीं है। पहली राय दें!' : 'No replies yet. Be the first to reply!'}
                      </p>
                    )}

                    {/* Add Comment Input Form */}
                    {isAuthenticated ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder={t('samvaad.writeComment')}
                          value={commentInputs[post._id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post._id);
                          }}
                          className="input"
                          style={{
                            flex: 1,
                            backgroundColor: 'var(--nb-white)',
                            fontSize: '0.88rem',
                            padding: '9px 12px'
                          }}
                        />
                        <button
                          onClick={() => handleAddComment(post._id)}
                          disabled={submittingComment[post._id]}
                          className="btn btn-primary"
                          style={{
                            padding: '9px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.88rem'
                          }}
                        >
                          <Send size={15} strokeWidth={2.5} />
                          <span>{t('samvaad.sendComment')}</span>
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '10px',
                          textAlign: 'center',
                          backgroundColor: 'var(--nb-white)',
                          border: '1.5px dashed var(--nb-black)',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                          चर्चा में भाग लेने के लिए{' '}
                          <Link to="/login" style={{ fontWeight: '900', color: 'var(--nb-black)' }}>
                            लॉग इन करें
                          </Link>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* 5. Create Post Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500,
            padding: '16px'
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="card"
            style={{
              backgroundColor: 'var(--nb-white)',
              border: 'var(--border-thick)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '24px 28px',
              animation: 'modalBackdropFade 0.2s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                marginBottom: '20px',
                borderBottom: 'var(--border-thin)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--nb-yellow-light)',
                    border: 'var(--border-medium)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Sparkles size={20} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)', margin: 0, lineHeight: 1.2 }}>
                    {t('samvaad.createPostTitle')}
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                    {lang === 'hi' ? 'अपने 5 किमी दायरे के किसान भाइयों से साझा करें' : 'Share with farmers within 5 km of your location'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}
                title="Close"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {createError && (
              <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                <AlertCircle size={18} strokeWidth={2.5} />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePost}>
              {/* Category */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '900', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', color: 'var(--nb-black)' }}>
                  {t('samvaad.category')} *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: '10px 14px', fontWeight: '700', fontSize: '0.92rem' }}
                >
                  <option value="general">{lang === 'hi' ? '💬 सामान्य चर्चा' : '💬 General Discussion'}</option>
                  <option value="crops">{lang === 'hi' ? '🌾 फसल व बुवाई परामर्श' : '🌾 Crops & Sowing'}</option>
                  <option value="equipment">{lang === 'hi' ? '🚜 ट्रैक्टर व मशीनरी साझा' : '🚜 Equipment Sharing'}</option>
                  <option value="weather_alert">{lang === 'hi' ? '🌦️ स्थानीय मौसम चेतावनी' : '🌦️ Local Weather Alert'}</option>
                  <option value="pest_help">{lang === 'hi' ? '🐛 कीट व रोग नियंत्रण' : '🐛 Pest & Disease Help'}</option>
                  <option value="market_advice">{lang === 'hi' ? '📈 मंडी भाव व विपणन' : '📈 Mandi Advice'}</option>
                </select>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '900', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', color: 'var(--nb-black)' }}>
                  {lang === 'hi' ? 'विषय या शीर्षक (वैकल्पिक)' : 'Topic / Headline (Optional)'}:
                </label>
                <input
                  type="text"
                  placeholder={t('samvaad.postTitlePlaceholder')}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: '10px 14px', fontWeight: '700', fontSize: '0.92rem' }}
                  maxLength={150}
                />
              </div>

              {/* Content */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '900', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', color: 'var(--nb-black)' }}>
                  {lang === 'hi' ? 'संदेश / विवरण *' : 'Post Content *'}:
                </label>
                <textarea
                  placeholder={t('samvaad.postContentPlaceholder')}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="input"
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontWeight: '600',
                    fontSize: '0.92rem',
                    lineHeight: 1.5,
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Image Upload Area (Cloudinary) */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontWeight: '900', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', color: 'var(--nb-black)' }}>
                  {lang === 'hi' ? 'फसल / खेत की फोटो (वैकल्पिक)' : 'Attach Photo (Optional)'}:
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />

                {!selectedImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--nb-black)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--nb-canvas-alt)',
                      padding: '16px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--nb-yellow-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--nb-canvas-alt)')}
                  >
                    <Camera size={26} strokeWidth={2.5} style={{ margin: '0 auto 6px', color: 'var(--nb-black)' }} />
                    <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--nb-black)' }}>
                      {lang === 'hi' ? 'फोटो अपलोड करने के लिए क्लिक करें' : 'Click to Upload Crop / Problem Photo'}
                    </div>
                    <div style={{ fontSize: '0.76rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      JPG, PNG, WebP (Max 5MB) • Cloudinary सुरक्षित स्टोरेज
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: 'var(--nb-yellow-light)',
                      border: 'var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                      <img
                        src={imagePreview}
                        alt="Upload Preview"
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: 'var(--radius-sm)',
                          objectFit: 'cover',
                          border: '1.5px solid #000',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontWeight: '800',
                            fontSize: '0.88rem',
                            color: 'var(--nb-black)',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {selectedImage.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#166534', marginTop: '2px' }}>
                          {(selectedImage.size / 1024).toFixed(0)} KB • फोटो अपलोड के लिए तैयार
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 10px', color: '#dc2626', flexShrink: 0 }}
                      title="Remove image"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                      <span style={{ fontSize: '0.8rem' }}>{lang === 'hi' ? 'हटाएं' : 'Remove'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Geo location Notice Box */}
              <div
                style={{
                  backgroundColor: 'var(--nb-green-light)',
                  border: 'var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                  fontSize: '0.82rem',
                  fontWeight: '700'
                }}
              >
                <MapPin size={18} strokeWidth={2.5} style={{ color: '#dc2626', flexShrink: 0 }} />
                <span>
                  {lang === 'hi' ? (
                    <>यह पोस्ट आपके स्थान (<strong>{user?.district || user?.city || 'Delhi'}</strong>, {userLat.toFixed(3)}°N, {userLon.toFixed(3)}°E) के <strong>5 किमी</strong> दायरे के किसानों को तुरंत दिखाई देगी।</>
                  ) : (
                    <>This post will instantly appear to farmers within a <strong>5 km radius</strong> of your location (<strong>{user?.district || user?.city || 'Delhi'}</strong>).</>
                  )}
                </span>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: 'var(--border-thin)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={creatingPost}
                  style={{ padding: '10px 18px', fontWeight: '800' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creatingPost}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 22px',
                    fontWeight: '900'
                  }}
                >
                  <Send size={16} strokeWidth={2.5} />
                  <span>{creatingPost ? t('common.loading') : t('samvaad.publishPost')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Samvaad;
