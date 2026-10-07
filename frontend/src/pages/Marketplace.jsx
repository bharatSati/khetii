import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { marketplaceService } from '../services/marketplaceService';
import {
  ShoppingBag,
  PlusCircle,
  Search,
  ExternalLink,
  Phone,
  MapPin,
  Tag,
  Trash2,
  Edit,
  AlertCircle,
  Globe,
  ShoppingCart,
  Star,
  CheckCircle2,
  Share2,
  Plus,
  Minus,
  MessageCircle,
  X,
  UserCheck,
  Send,
  Eye,
  ShieldCheck,
  Package
} from 'lucide-react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

const CATEGORIES = [
  'All',
  'Crops & Produce',
  'Seeds',
  'Fertilisers & Organic Manure',
  'Tools & Equipment',
  'Pesticides & Bio-agents',
  'Livestock & Fodder'
];

const UNITS = ['kg', 'quintal', 'piece', 'day', 'hour', 'litre', 'bag'];

// SVG WhatsApp Icon
const WhatsAppIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.82 2.791.82 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm9.969 5.828c0 5.518-4.482 10-10 10-1.748 0-3.388-.453-4.821-1.246l-5.179 1.356 1.378-5.048c-.878-1.488-1.378-3.226-1.378-5.062 0-5.518 4.482-10 10-10s10 4.482 10 10z" />
  </svg>
);

export const Marketplace = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language?.startsWith('hi');
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'farmer'); // 'farmer' or 'external'

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Farmer listings state (MongoDB)
  const [farmerListings, setFarmerListings] = useState([]);
  const [loadingFarmer, setLoadingFarmer] = useState(false);

  // External listings state (Live, never stored)
  const [externalListings, setExternalListings] = useState([]);
  const [externalConfigured, setExternalConfigured] = useState(true);
  const [externalMessage, setExternalMessage] = useState('');
  const [loadingExternal, setLoadingExternal] = useState(false);

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [modalForm, setModalForm] = useState({
    title: '',
    category: 'Crops & Produce',
    description: '',
    price: '',
    unit: 'quintal',
    quantity: '1',
    location: user?.district ? `${user.district}, ${user?.state || ''}` : '',
    contactPhone: '',
    whatsappNumber: '',
    imageUrl: '',
    sellerName: user?.name || '',
    sellerExperience: 'प्रमाणित किसान (Verified Member)'
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Product Details Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailQuantity, setDetailQuantity] = useState(1);

  // Reviews submission inside details modal
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewUserName, setReviewUserName] = useState(user?.name || '');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('kheti_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Save cart changes
  useEffect(() => {
    try {
      localStorage.setItem('kheti_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  // Show temporary toast feedback
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Helper to construct WhatsApp URL
  const getWhatsAppUrl = (phone, text = '') => {
    if (!phone) return '#';
    let clean = String(phone).replace(/[^0-9]/g, '');
    if (clean.length === 10) clean = '91' + clean;
    return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
  };

  // Direct WhatsApp contact with seller
  const handleDirectWhatsApp = (e, item) => {
    e.stopPropagation();
    const phone = item.whatsappNumber || item.contactPhone;
    if (!phone) return;

    const message = isHindi
      ? `नमस्ते! मैंने Khetii Marketplace पर आपका उत्पाद "${item.title}" (मूल्य: ₹${item.price}/${item.unit}, स्थान: ${item.location}) देखा है। मैं इसे खरीदना चाहता हूँ, कृपया उपलब्धता और डिलीवरी की जानकारी दें। धन्यवाद!`
      : `Hello! I saw your listing "${item.title}" (Price: ₹${item.price}/${item.unit}, Location: ${item.location}) on Khetii Marketplace. I am interested in purchasing this. Please share availability and delivery details.`;

    window.open(getWhatsAppUrl(phone, message), '_blank', 'noopener,noreferrer');
  };

  // Add item to cart
  const handleAddToCart = (e, item, qty = 1) => {
    if (e && e.stopPropagation) e.stopPropagation();

    setCart((prev) => {
      const existingIndex = prev.findIndex((x) => x.id === (item._id || item.id));
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex].cartQuantity += qty;
        return copy;
      } else {
        return [
          ...prev,
          {
            id: item._id || item.id,
            title: item.title,
            price: Number(item.price) || 0,
            unit: item.unit || 'unit',
            imageUrl: item.imageUrl || '',
            category: item.category || '',
            location: item.location || '',
            contactPhone: item.contactPhone || '',
            whatsappNumber: item.whatsappNumber || item.contactPhone || '',
            sellerName: item.sellerName || item.user?.name || 'साथी किसान',
            cartQuantity: qty,
            stock: item.quantity || 1
          }
        ];
      }
    });

    showToast(isHindi ? `✅ "${item.title}" कार्ट में जोड़ा गया!` : `✅ "${item.title}" added to cart!`);
  };

  // Update cart item quantity
  const handleUpdateCartQuantity = (id, newQty) => {
    if (newQty <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cartQuantity: newQty } : item))
    );
  };

  // Remove single item from cart
  const handleRemoveFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear entire cart
  const handleClearCart = () => {
    setCart([]);
    showToast(isHindi ? 'कार्ट खाली कर दी गई है।' : 'Cart cleared.');
  };

  // Calculate totals
  const totalCartItems = cart.reduce((acc, item) => acc + item.cartQuantity, 0);
  const totalCartPrice = cart.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);

  // Send consolidated cart order to primary seller via WhatsApp
  const handleCartWhatsAppOrder = () => {
    if (cart.length === 0) return;

    let itemsText = cart
      .map((it, idx) => `${idx + 1}. ${it.title} - ${it.cartQuantity} ${it.unit} (₹${(it.price * it.cartQuantity).toLocaleString()}) [विक्रेता: ${it.sellerName}]`)
      .join('\n');

    const message = isHindi
      ? `नमस्ते! मैंने Khetii Marketplace से निम्नलिखित उत्पाद ऑर्डर/पूछताछ के लिए चुने हैं:\n\n${itemsText}\n\nकुल योग: ₹${totalCartPrice.toLocaleString()}\n\nकृपया मुझे डिलीवरी और भुगतान का ब्योरा बताएं। धन्यवाद!`
      : `Hello! I would like to inquire about the following items from Khetii Marketplace:\n\n${itemsText}\n\nTotal Estimated Amount: ₹${totalCartPrice.toLocaleString()}\n\nPlease provide delivery and payment details. Thank you!`;

    // Take WhatsApp number of the first item or fallback to Kheti helpline
    const targetPhone = cart[0]?.whatsappNumber || cart[0]?.contactPhone || '18001801551';
    window.open(getWhatsAppUrl(targetPhone, message), '_blank', 'noopener,noreferrer');
  };

  // Open details modal
  const handleOpenDetails = (item) => {
    setSelectedProduct(item);
    setDetailQuantity(1);
    setReviewRating(5);
    setReviewComment('');
    setReviewUserName(user?.name || '');
    setReviewMessage('');
  };

  // Submit review for selected product
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !selectedProduct._id) return;

    setSubmittingReview(true);
    setReviewMessage('');

    try {
      const res = await marketplaceService.addListingReview(selectedProduct._id, {
        rating: reviewRating,
        comment: reviewComment,
        userName: reviewUserName || (user ? user.name : 'साथी किसान')
      });

      if (res && res.listing) {
        setSelectedProduct(res.listing);
        // Also update list in background
        setFarmerListings((prev) =>
          prev.map((it) => (it._id === res.listing._id ? res.listing : it))
        );
        setReviewComment('');
        setReviewMessage(isHindi ? '🎉 आपकी समीक्षा सफलतापूर्वक दर्ज हुई!' : '🎉 Review submitted successfully!');
        showToast(isHindi ? 'समीक्षा दर्ज हुई!' : 'Review posted!');
      }
    } catch (err) {
      console.error('Review error:', err);
      setReviewMessage(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Fetch farmer listings
  const fetchFarmerListings = async () => {
    setLoadingFarmer(true);
    try {
      const data = await marketplaceService.getFarmerListings({
        q: search || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        location: location || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined
      });
      setFarmerListings(data.listings || []);
    } catch (err) {
      console.error('Failed to fetch farmer listings:', err);
    } finally {
      setLoadingFarmer(false);
    }
  };

  // Fetch external listings
  const fetchExternalListings = async () => {
    setLoadingExternal(true);
    try {
      const data = await marketplaceService.getExternalListings({
        q: search || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined
      });
      setExternalConfigured(data.configured);
      setExternalMessage(data.message || '');
      setExternalListings(data.listings || []);
    } catch (err) {
      console.error('External marketplace error:', err);
      setExternalConfigured(false);
      setExternalMessage(err.message);
    } finally {
      setLoadingExternal(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'farmer') {
      fetchFarmerListings();
    } else {
      fetchExternalListings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, selectedCategory, location, minPrice, maxPrice]);

  const handleOpenCreateModal = () => {
    setEditingListing(null);
    setModalForm({
      title: '',
      category: 'Crops & Produce',
      description: '',
      price: '',
      unit: 'quintal',
      quantity: '1',
      location: user?.district ? `${user.district}, ${user?.state || ''}` : '',
      contactPhone: '',
      whatsappNumber: '',
      imageUrl: '',
      sellerName: user?.name || '',
      sellerExperience: 'प्रमाणित किसान (Verified Member)'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e, listing) => {
    e.stopPropagation();
    setEditingListing(listing);
    setModalForm({
      title: listing.title,
      category: listing.category,
      description: listing.description || '',
      price: listing.price,
      unit: listing.unit,
      quantity: listing.quantity || 1,
      location: listing.location,
      contactPhone: listing.contactPhone,
      whatsappNumber: listing.whatsappNumber || listing.contactPhone,
      imageUrl: listing.imageUrl || '',
      sellerName: listing.sellerName || listing.user?.name || '',
      sellerExperience: listing.sellerExperience || 'प्रमाणित किसान (Verified Member)'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteListing = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('क्या आप इस विज्ञापन को हटाना चाहते हैं? / Are you sure?')) return;
    try {
      await marketplaceService.deleteListing(id);
      fetchFarmerListings();
      if (selectedProduct && selectedProduct._id === id) {
        setSelectedProduct(null);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitListing = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      if (editingListing) {
        await marketplaceService.updateListing(editingListing._id, modalForm);
      } else {
        await marketplaceService.createListing(modalForm);
      }
      setIsModalOpen(false);
      fetchFarmerListings();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '84px',
            right: '24px',
            zIndex: 1100,
            backgroundColor: 'var(--nb-black)',
            color: 'var(--nb-white)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-sm)',
            border: '2px solid var(--nb-yellow)',
            boxShadow: 'var(--shadow-md)',
            fontWeight: '800',
            fontSize: '0.9rem',
            animation: 'fadeIn 0.2s ease forwards'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">{t('marketplace.title')}</h1>
          <p className="page-subtitle">{t('marketplace.subtitle')}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Floating Cart Trigger Button in Header */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: cart.length > 0 ? 'var(--nb-yellow-light)' : 'var(--nb-white)',
              border: 'var(--border-thick)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <ShoppingCart size={19} strokeWidth={2.5} />
            <span style={{ fontWeight: '900' }}>
              {isHindi ? 'कार्ट' : 'Cart'} {cart.length > 0 && `(${totalCartItems})`}
            </span>
            {cart.length > 0 && (
              <span className="badge badge-gold" style={{ fontSize: '0.78rem', padding: '2px 6px' }}>
                ₹{totalCartPrice.toLocaleString()}
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <button onClick={handleOpenCreateModal} className="btn btn-primary">
              <PlusCircle size={18} strokeWidth={2.5} />
              <span>{t('marketplace.createListing')}</span>
            </button>
          ) : (
            <a href="/login" className="btn btn-outline btn-sm">
              <span>{isHindi ? 'लॉग इन करके बेचें' : 'Login to Sell'}</span>
            </a>
          )}
        </div>
      </div>

      {/* Two Neo-Brutalist Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'farmer' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('farmer');
            setSearchParams({ tab: 'farmer' });
          }}
        >
          <ShoppingBag size={18} strokeWidth={2.5} />
          <span>{t('marketplace.tabFarmer')}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'external' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('external');
            setSearchParams({ tab: 'external' });
          }}
        >
          <Globe size={18} strokeWidth={2.5} />
          <span>{t('marketplace.tabExternal')}</span>
        </button>
      </div>

      {/* Filters Card */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-xl)',
          backgroundColor: 'var(--nb-yellow-light)',
          border: 'var(--border-thick)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('common.search')}</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} strokeWidth={2.5} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--nb-black)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px', backgroundColor: 'var(--nb-white)' }}
                placeholder={t('marketplace.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('marketplace.category')}</label>
            <select
              className="form-select"
              style={{ backgroundColor: 'var(--nb-white)' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('marketplace.location')}</label>
            <input
              type="text"
              className="form-input"
              style={{ backgroundColor: 'var(--nb-white)' }}
              placeholder={isHindi ? 'उदा. सीहोर, मेरठ, नासिक' : 'e.g. Sehore, Meerut, Nashik'}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('marketplace.priceRange')}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                className="form-input"
                style={{ backgroundColor: 'var(--nb-white)' }}
                placeholder={t('marketplace.min')}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                type="number"
                className="form-input"
                style={{ backgroundColor: 'var(--nb-white)' }}
                placeholder={t('marketplace.max')}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab 1: Farmer Listings (MongoDB) */}
      {activeTab === 'farmer' && (
        <div>
          {loadingFarmer ? (
            <Loader message={t('common.loading')} />
          ) : farmerListings.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={isHindi ? 'कोई किसान विज्ञापन नहीं मिला' : 'No Farmer Listings Found'}
              description={isHindi ? 'इस श्रेणी में अभी कोई विज्ञापन नहीं है। क्या आप अपनी उपज या उपकरण का विज्ञापन पोस्ट करना चाहते हैं?' : 'No listings found. Post your crop or equipment for fellow farmers.'}
              actionText={isAuthenticated ? t('marketplace.createListing') : ''}
              onAction={handleOpenCreateModal}
            />
          ) : (
            <div className="grid grid-cols-3">
              {farmerListings.map((item) => {
                const isOwner = user && item.user?._id === user._id;
                const inCart = cart.find((c) => c.id === item._id);

                return (
                  <div
                    key={item._id}
                    onClick={() => handleOpenDetails(item)}
                    className="card card-hover"
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: 'var(--border-thick)',
                      boxShadow: 'var(--shadow-md)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div>
                      {/* Product Image */}
                      {item.imageUrl ? (
                        <div
                          style={{
                            height: '180px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'var(--border-medium)',
                            overflow: 'hidden',
                            marginBottom: 'var(--space-md)',
                            backgroundColor: 'var(--nb-canvas-alt)',
                            position: 'relative'
                          }}
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => (e.target.style.display = 'none')}
                          />
                          {/* Rating Pill overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              backgroundColor: 'rgba(0,0,0,0.85)',
                              color: 'var(--nb-white)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.78rem',
                              fontWeight: '900',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Star size={13} fill="#facc15" stroke="#facc15" />
                            <span>{item.averageRating || 4.8}</span>
                            <span style={{ opacity: 0.8, fontSize: '0.72rem' }}>
                              ({item.reviews?.length || item.reviewCount || 0})
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            height: '140px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'var(--border-medium)',
                            marginBottom: 'var(--space-md)',
                            backgroundColor: 'var(--nb-yellow-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--nb-black)'
                          }}
                        >
                          <Package size={48} strokeWidth={2} />
                        </div>
                      )}

                      {/* Category & Price Strip */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                          {item.category}
                        </span>
                        <div
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: '900',
                            color: 'var(--nb-black)',
                            backgroundColor: 'var(--nb-yellow)',
                            border: '1.5px solid #000',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          ₹{item.price}
                          <span style={{ fontSize: '0.78rem', fontWeight: '700' }}>
                            /{item.unit}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h2 style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '6px', lineHeight: 1.3 }}>
                        {item.title}
                      </h2>

                      {/* Description */}
                      {item.description && (
                        <p style={{ fontSize: '0.86rem', fontWeight: '600', color: 'var(--color-text-secondary)', lineHeight: 1.4, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.description}
                        </p>
                      )}

                      {/* Location & Quantity Meta */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.82rem', fontWeight: '700', color: 'var(--nb-black)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} strokeWidth={2.5} />
                          <span>{item.location}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Tag size={14} strokeWidth={2.5} />
                          <span>{isHindi ? 'उपलब्ध:' : 'Stock:'} {item.quantity} {item.unit}</span>
                        </div>
                        <div style={{ marginTop: '2px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <UserCheck size={14} strokeWidth={2.5} style={{ color: 'var(--nb-green)' }} />
                          <span>{item.sellerName || item.user?.name || 'साथी किसान'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Strip */}
                    <div
                      style={{
                        marginTop: 'var(--space-md)',
                        paddingTop: 'var(--space-sm)',
                        borderTop: 'var(--border-thin)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      {/* Top Action Row: WhatsApp & Call */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {/* Direct WhatsApp Button */}
                        <button
                          type="button"
                          onClick={(e) => handleDirectWhatsApp(e, item)}
                          style={{
                            backgroundColor: '#25D366',
                            color: '#ffffff',
                            border: '2px solid #000000',
                            borderRadius: 'var(--radius-sm)',
                            boxShadow: '2px 2px 0px #000000',
                            fontWeight: '900',
                            fontSize: '0.82rem',
                            padding: '8px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <WhatsAppIcon size={17} color="#ffffff" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Call Button */}
                        <a
                          href={`tel:${item.contactPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="btn btn-secondary btn-sm"
                          style={{
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontSize: '0.82rem'
                          }}
                        >
                          <Phone size={15} strokeWidth={2.5} />
                          <span>{isHindi ? 'कॉल करें' : 'Call'}</span>
                        </a>
                      </div>

                      {/* Bottom Action Row: Add to Cart & Owner Edit/Delete */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, item, 1)}
                          className="btn btn-primary btn-sm"
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            backgroundColor: inCart ? 'var(--nb-yellow-light)' : undefined,
                            color: inCart ? 'var(--nb-black)' : undefined
                          }}
                        >
                          <ShoppingCart size={15} strokeWidth={2.5} />
                          <span>
                            {inCart
                              ? (isHindi ? `कार्ट में (${inCart.cartQuantity}) +` : `In Cart (${inCart.cartQuantity}) +`)
                              : (isHindi ? 'कार्ट में जोड़ें' : 'Add to Cart')}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(item);
                          }}
                          className="btn btn-secondary btn-sm"
                          title={isHindi ? 'विवरण व समीक्षाएं' : 'View Details & Reviews'}
                          style={{ padding: '6px 10px' }}
                        >
                          <Eye size={16} strokeWidth={2.5} />
                        </button>

                        {isOwner && (
                          <>
                            <button
                              onClick={(e) => handleOpenEditModal(e, item)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px 8px' }}
                              title="Edit"
                            >
                              <Edit size={15} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteListing(e, item._id)}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '6px 8px' }}
                              title="Delete"
                            >
                              <Trash2 size={15} strokeWidth={2.5} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: External Sources (Live Adapter) */}
      {activeTab === 'external' && (
        <div>
          {!externalConfigured ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: 'var(--space-2xl)',
                backgroundColor: 'var(--nb-yellow-light)',
                border: 'var(--border-thick)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <Globe size={48} strokeWidth={2.5} style={{ color: 'var(--nb-black)', marginBottom: 'var(--space-md)' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '8px' }}>
                {t('marketplace.externalNotConfigured')}
              </h2>
              <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-text-secondary)', maxWidth: '560px', margin: '0 auto' }}>
                बाहरी मार्केटप्लेस एपीआई सर्वर पर कॉन्फ़िगर नहीं है (MARKETPLACE_API_URL)। परियोजना के नियमों के अनुसार फर्जी उत्पाद नहीं दिखाए जाते हैं।
              </p>
            </div>
          ) : loadingExternal ? (
            <Loader message="Fetching live external marketplace listings..." />
          ) : externalListings.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="कोई बाहरी परिणाम नहीं मिला"
              description="कृपया अन्य खोज शब्द दर्ज करें।"
            />
          ) : (
            <div className="grid grid-cols-3">
              {externalListings.map((item) => (
                <div
                  key={item.id}
                  className="card card-hover"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: 'var(--border-thick)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span className="badge badge-earth">{item.category}</span>
                      <span className="badge badge-info">{item.provider}</span>
                    </div>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '6px' }}>
                      {item.title}
                    </h2>

                    {item.price && (
                      <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '8px', backgroundColor: 'var(--nb-yellow)', padding: '2px 8px', border: '1.5px solid #000', display: 'inline-block' }}>
                        ₹{item.price} {item.unit && `/${item.unit}`}
                      </div>
                    )}

                    <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                      {item.description}
                    </p>
                  </div>

                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ alignSelf: 'flex-start', marginTop: 'var(--space-md)' }}
                    >
                      <span>स्रोत पर देखें</span>
                      <ExternalLink size={14} strokeWidth={2.5} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Cart Trigger for Mobile/Desktop */}
      {cart.length > 0 && !isCartOpen && (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="btn btn-primary"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 990,
            padding: '14px 22px',
            borderRadius: '40px',
            boxShadow: 'var(--shadow-xl)',
            border: 'var(--border-thick)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <ShoppingCart size={22} strokeWidth={2.5} />
          <span style={{ fontSize: '0.95rem', fontWeight: '900' }}>
            {isHindi ? 'कार्ट देखें' : 'View Cart'} ({totalCartItems})
          </span>
          <span
            style={{
              backgroundColor: 'var(--nb-yellow)',
              color: 'var(--nb-black)',
              padding: '2px 8px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '900',
              border: '1.5px solid #000'
            }}
          >
            ₹{totalCartPrice.toLocaleString()}
          </span>
        </button>
      )}

      {/* MODAL 1: Product Details, Seller Profile & Reviews Modal */}
      {selectedProduct && (
        <Modal
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          title={selectedProduct.title}
          maxWidth="760px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Product Section (Image + Key Specs) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Product Image */}
              <div
                style={{
                  borderRadius: 'var(--radius-sm)',
                  border: 'var(--border-medium)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--nb-canvas-alt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxHeight: '280px'
                }}
              >
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <Package size={56} strokeWidth={2} style={{ color: 'var(--nb-black)', margin: '0 auto 8px' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>{selectedProduct.category}</span>
                  </div>
                )}
              </div>

              {/* Price, Stock & Description */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-success">{selectedProduct.category}</span>
                    <span className="badge badge-gold">
                      ⭐ {selectedProduct.averageRating || 4.8} ({selectedProduct.reviews?.length || selectedProduct.reviewCount || 0} {isHindi ? 'समीक्षाएं' : 'reviews'})
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '1.6rem',
                      fontWeight: '900',
                      color: 'var(--nb-black)',
                      backgroundColor: 'var(--nb-yellow-light)',
                      border: '2px solid #000',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'inline-block',
                      marginBottom: '10px'
                    }}
                  >
                    ₹{selectedProduct.price}{' '}
                    <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>/{selectedProduct.unit}</span>
                  </div>

                  <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                    {selectedProduct.description || (isHindi ? 'सीधे किसान के खेत से ताज़ा व प्रमाणित उत्पाद।' : 'Fresh and direct farm product from verified grower.')}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.88rem', fontWeight: '700', color: 'var(--nb-black)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={16} strokeWidth={2.5} />
                      <span>{selectedProduct.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={16} strokeWidth={2.5} />
                      <span>{isHindi ? 'उपलब्ध कुल स्टॉक:' : 'Total Stock:'} {selectedProduct.quantity} {selectedProduct.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* WhatsApp Direct Connect */}
                  <button
                    type="button"
                    onClick={(e) => handleDirectWhatsApp(e, selectedProduct)}
                    style={{
                      backgroundColor: '#25D366',
                      color: '#ffffff',
                      border: '2.5px solid #000000',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-sm)',
                      padding: '12px',
                      fontWeight: '900',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <WhatsAppIcon size={20} color="#ffffff" />
                    <span>{isHindi ? 'विक्रेता से सीधे WhatsApp पर जुड़ें' : 'Chat on WhatsApp with Seller'}</span>
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {/* Call Button */}
                    <a
                      href={`tel:${selectedProduct.contactPhone}`}
                      className="btn btn-secondary"
                      style={{
                        textDecoration: 'none',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Phone size={17} strokeWidth={2.5} />
                      <span>{isHindi ? 'फ़ोन करें' : 'Call'}</span>
                    </a>

                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(null, selectedProduct, detailQuantity)}
                      className="btn btn-primary"
                      style={{
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <ShoppingCart size={17} strokeWidth={2.5} />
                      <span>{isHindi ? 'कार्ट में जोड़ें' : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Profile Box */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--nb-purple-light)',
                border: 'var(--border-thick)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--nb-white)',
                      border: 'var(--border-medium)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: '1.2rem',
                      color: 'var(--nb-black)'
                    }}
                  >
                    👨‍🌾
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '900', fontSize: '1.05rem', color: 'var(--nb-black)' }}>
                        {selectedProduct.sellerName || selectedProduct.user?.name || 'साथी किसान'}
                      </span>
                      <span className="badge badge-green" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                        <ShieldCheck size={12} strokeWidth={2.5} /> {isHindi ? 'प्रमाणित किसान' : 'Verified'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                      {selectedProduct.sellerExperience || '5+ वर्षों से Khetii सदस्य'} • {selectedProduct.location}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--color-text-secondary)' }}>
                    {isHindi ? 'विक्रेता रेटिंग' : 'Seller Rating'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                    ⭐ {selectedProduct.averageRating || 4.8} / 5.0
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div
              style={{
                padding: '18px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--nb-white)',
                border: 'var(--border-thick)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--nb-black)', margin: 0 }}>
                  💬 {isHindi ? 'किसानों की समीक्षाएं व रेटिंग' : 'Farmer Reviews & Feedback'} ({selectedProduct.reviews?.length || selectedProduct.reviewCount || 0})
                </h3>
              </div>

              {/* Reviews List */}
              {selectedProduct.reviews && selectedProduct.reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                  {selectedProduct.reviews.map((rev, idx) => (
                    <div
                      key={rev._id || idx}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--nb-canvas-alt)',
                        border: 'var(--border-thin)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '900', fontSize: '0.9rem', color: 'var(--nb-black)' }}>
                            {rev.userName}
                          </span>
                          {rev.verifiedBuyer && (
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--nb-green)' }}>
                              ✓ {isHindi ? 'सत्यापित खरीदार' : 'Verified Buyer'}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#eab308' }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={i < Math.round(rev.rating) ? '#facc15' : 'none'}
                              stroke={i < Math.round(rev.rating) ? '#ca8a04' : '#9ca3af'}
                            />
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.86rem', fontWeight: '600', color: 'var(--nb-black)', margin: 0, lineHeight: 1.4 }}>
                        {rev.comment || (isHindi ? 'बहुत बढ़िया उत्पाद!' : 'Great quality product!')}
                      </p>
                      <div style={{ marginTop: '4px', fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'हाल ही में'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--nb-canvas-alt)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                    {isHindi ? 'अभी कोई समीक्षा नहीं है। इस विक्रेता के पहले समीक्षक बनें!' : 'No reviews yet. Be the first to share your feedback!'}
                  </p>
                </div>
              )}

              {/* Add Review Form */}
              <form onSubmit={handleSubmitReview} style={{ borderTop: 'var(--border-thin)', paddingTop: '14px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '10px' }}>
                  ✍️ {isHindi ? 'अपनी समीक्षा लिखें:' : 'Write Your Review:'}
                </h4>

                {/* Star Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--nb-black)' }}>
                    {isHindi ? 'रेटिंग दें:' : 'Rating:'}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setReviewRating(starVal)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex'
                        }}
                      >
                        <Star
                          size={22}
                          fill={starVal <= reviewRating ? '#facc15' : 'none'}
                          stroke={starVal <= reviewRating ? '#ca8a04' : '#9ca3af'}
                          strokeWidth={2}
                        />
                      </button>
                    ))}
                  </div>
                  <span style={{ fontWeight: '900', fontSize: '0.9rem', color: 'var(--nb-black)', marginLeft: '4px' }}>
                    {reviewRating} / 5
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={isHindi ? 'आपका नाम (उदा. महेश पाटीदार)' : 'Your Name'}
                      value={reviewUserName}
                      onChange={(e) => setReviewUserName(e.target.value)}
                      required
                      style={{ fontSize: '0.88rem' }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={isHindi ? 'उत्पाद गुणवत्ता, वजन व व्यवहार पर टिप्पणी...' : 'Your review comments...'}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                      style={{ fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                {reviewMessage && (
                  <div style={{ marginBottom: '10px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--nb-green)' }}>
                    {reviewMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={15} strokeWidth={2.5} />
                  <span>{submittingReview ? (isHindi ? 'दर्ज हो रहा है...' : 'Submitting...') : (isHindi ? 'समीक्षा सबमिट करें' : 'Submit Review')}</span>
                </button>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: Farmer Shopping Cart Drawer / Modal */}
      {isCartOpen && (
        <Modal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          title={isHindi ? '🌾 किसान शॉपिंग कार्ट' : '🌾 Farmer Shopping Cart'}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'var(--nb-canvas-alt)', borderRadius: 'var(--radius-sm)' }}>
                <ShoppingCart size={48} strokeWidth={2} style={{ color: 'var(--nb-black)', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '6px' }}>
                  {isHindi ? 'आपकी कार्ट अभी खाली है' : 'Your cart is empty'}
                </h3>
                <p style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                  {isHindi
                    ? 'मार्केटप्लेस से अपनी पसंद का अनाज, बीज, खाद या उपकरण चुनें और "कार्ट में जोड़ें" बटन दबाएं।'
                    : 'Explore the marketplace and click "Add to Cart" on produce, seeds, or tools.'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="btn btn-primary"
                >
                  {isHindi ? 'उत्पाद देखें' : 'Browse Products'}
                </button>
              </div>
            ) : (
              <>
                {/* Cart items list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--nb-white)',
                        border: 'var(--border-medium)',
                        boxShadow: 'var(--shadow-sm)',
                        gap: '12px'
                      }}
                    >
                      {/* Image */}
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'var(--border-thin)',
                          overflow: 'hidden',
                          backgroundColor: 'var(--nb-canvas-alt)',
                          flexShrink: 0
                        }}
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Package size={24} style={{ margin: '14px' }} />
                        )}
                      </div>

                      {/* Title & Seller */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '900', fontSize: '0.92rem', color: 'var(--nb-black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                          ₹{item.price}/{item.unit} • {item.sellerName}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(item.id, item.cartQuantity - 1)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px' }}
                        >
                          <Minus size={13} strokeWidth={3} />
                        </button>
                        <span style={{ fontWeight: '900', fontSize: '0.9rem', minWidth: '28px', textAlign: 'center' }}>
                          {item.cartQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(item.id, item.cartQuantity + 1)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px' }}
                        >
                          <Plus size={13} strokeWidth={3} />
                        </button>
                      </div>

                      {/* Total Item Price */}
                      <div style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--nb-black)', minWidth: '70px', textAlign: 'right' }}>
                        ₹{(item.price * item.cartQuantity).toLocaleString()}
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px', color: 'var(--nb-red)' }}
                        title="Remove"
                      >
                        <Trash2 size={15} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Price Totals & Summary Card */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--nb-yellow-light)',
                    border: 'var(--border-thick)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--nb-black)' }}>
                      {isHindi ? 'कुल चुनी गई वस्तुएं:' : 'Total Items:'}
                    </span>
                    <span style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--nb-black)' }}>
                      {totalCartItems} {isHindi ? 'इकाइयां' : 'units'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: 'var(--border-thin)', paddingTop: '8px' }}>
                    <span style={{ fontWeight: '900', fontSize: '1.15rem', color: 'var(--nb-black)' }}>
                      {isHindi ? 'कुल अनुमानित योग (Subtotal):' : 'Cart Subtotal:'}
                    </span>
                    <span style={{ fontWeight: '900', fontSize: '1.4rem', color: 'var(--nb-black)' }}>
                      ₹{totalCartPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Cart Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* WhatsApp Bulk Inquiry / Order Button */}
                  <button
                    type="button"
                    onClick={handleCartWhatsAppOrder}
                    style={{
                      backgroundColor: '#25D366',
                      color: '#ffffff',
                      border: '2.5px solid #000000',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-md)',
                      padding: '14px',
                      fontWeight: '900',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <WhatsAppIcon size={22} color="#ffffff" />
                    <span>{isHindi ? 'WhatsApp पर सीधे ऑर्डर पूछताछ भेजें' : 'Send Order Inquiry via WhatsApp'}</span>
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--nb-red)' }}
                    >
                      <Trash2 size={14} />
                      <span>{isHindi ? 'पूरी कार्ट खाली करें' : 'Clear All'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      {isHindi ? 'शॉपिंग जारी रखें' : 'Continue Shopping'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL 3: Create / Edit Listing Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingListing ? t('common.edit') : t('marketplace.createListing')}
        >
          <form onSubmit={handleSubmitListing} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {formError && (
              <div className="alert alert-danger">
                <AlertCircle size={20} strokeWidth={2.5} />
                <span>{formError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{isHindi ? 'शीर्षक / उत्पाद का नाम *' : 'Title / Product Name *'}</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder={isHindi ? 'उदा. शरबती गेहूं, पूसा बोल्ड सरसों, देसी लाल प्याज' : 'e.g. Sharbati Wheat Grade A'}
                value={modalForm.title}
                onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">{t('marketplace.category')} *</label>
                <select
                  className="form-select"
                  value={modalForm.category}
                  onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{isHindi ? 'विक्रेता का नाम' : 'Seller Name'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={user?.name || 'साथी किसान'}
                  value={modalForm.sellerName}
                  onChange={(e) => setModalForm({ ...modalForm, sellerName: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">{isHindi ? 'मूल्य (₹) *' : 'Price (₹) *'}</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  min="0"
                  placeholder="2850"
                  value={modalForm.price}
                  onChange={(e) => setModalForm({ ...modalForm, price: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isHindi ? 'इकाई (Unit) *' : 'Unit *'}</label>
                <select
                  className="form-select"
                  value={modalForm.unit}
                  onChange={(e) => setModalForm({ ...modalForm, unit: e.target.value })}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{isHindi ? 'मात्रा (Quantity)' : 'Quantity'}</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  placeholder="50"
                  value={modalForm.quantity}
                  onChange={(e) => setModalForm({ ...modalForm, quantity: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">{t('marketplace.location')} *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Sehore, MP"
                  value={modalForm.location}
                  onChange={(e) => setModalForm({ ...modalForm, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isHindi ? 'संपर्क फ़ोन नंबर *' : 'Contact Phone *'}</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="9826012345"
                  value={modalForm.contactPhone}
                  onChange={(e) => setModalForm({ ...modalForm, contactPhone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">{isHindi ? 'WhatsApp नंबर (चैट हेतु)' : 'WhatsApp Number'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={modalForm.contactPhone || '9826012345'}
                  value={modalForm.whatsappNumber}
                  onChange={(e) => setModalForm({ ...modalForm, whatsappNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isHindi ? 'छवि URL (फ़ोटो लिंक)' : 'Image URL'}</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={modalForm.imageUrl}
                  onChange={(e) => setModalForm({ ...modalForm, imageUrl: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{isHindi ? 'विवरण (Description)' : 'Description'}</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder={isHindi ? 'उपज की किस्म, गुणवत्ता, डिलीवरी की शर्तें लिखें...' : 'Details about crop variety, packaging, delivery...'}
                value={modalForm.description}
                onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? t('common.loading') : (editingListing ? t('common.save') : t('common.submit'))}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Marketplace;
