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
  Globe
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

export const Marketplace = () => {
  const { t } = useTranslation();
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
    imageUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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
      imageUrl: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (listing) => {
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
      imageUrl: listing.imageUrl || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('क्या आप इस विज्ञापन को हटाना चाहते हैं? / Are you sure?')) return;
    try {
      await marketplaceService.deleteListing(id);
      fetchFarmerListings();
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
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('marketplace.title')}</h1>
          <p className="page-subtitle">{t('marketplace.subtitle')}</p>
        </div>
        {isAuthenticated ? (
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            <PlusCircle size={18} strokeWidth={2.5} />
            <span>{t('marketplace.createListing')}</span>
          </button>
        ) : (
          <a href="/login" className="btn btn-outline btn-sm">
            <span>लॉग इन करके विज्ञापन जोड़ें</span>
          </a>
        )}
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
              placeholder="e.g. Meerut, UP"
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
              title="कोई किसान विज्ञापन नहीं मिला"
              description="इस श्रेणी में अभी कोई विज्ञापन नहीं है। क्या आप अपनी उपज या उपकरण का विज्ञापन पोस्ट करना चाहते हैं?"
              actionText={isAuthenticated ? t('marketplace.createListing') : ''}
              onAction={handleOpenCreateModal}
            />
          ) : (
            <div className="grid grid-cols-3">
              {farmerListings.map((item) => {
                const isOwner = user && item.user?._id === user._id;
                return (
                  <div
                    key={item._id}
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
                      {item.imageUrl && (
                        <div
                          style={{
                            height: '170px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'var(--border-medium)',
                            overflow: 'hidden',
                            marginBottom: 'var(--space-md)',
                            backgroundColor: 'var(--nb-canvas-alt)'
                          }}
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => (e.target.style.display = 'none')}
                          />
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span className="badge badge-success">{item.category}</span>
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

                      <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '6px' }}>
                        {item.title}
                      </h2>

                      {item.description && (
                        <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                          {item.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--nb-black)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={15} strokeWidth={2.5} />
                          <span>{item.location}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Tag size={15} strokeWidth={2.5} />
                          <span>मात्रा: {item.quantity} {item.unit}</span>
                        </div>
                        <div style={{ marginTop: '2px', color: 'var(--color-text-secondary)' }}>
                          {t('marketplace.postedBy')}: <strong>{item.user?.name || 'साथी किसान'}</strong>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 'var(--space-md)',
                        paddingTop: 'var(--space-sm)',
                        borderTop: 'var(--border-thin)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <a
                        href={`tel:${item.contactPhone}`}
                        className="btn btn-primary btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        <Phone size={15} strokeWidth={2.5} />
                        <span>{item.contactPhone}</span>
                      </a>

                      {isOwner && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 8px' }}
                            title="Edit"
                          >
                            <Edit size={15} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => handleDeleteListing(item._id)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '6px 8px' }}
                            title="Delete"
                          >
                            <Trash2 size={15} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}
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
                      <span>स्रोत पर देखें / Open</span>
                      <ExternalLink size={15} strokeWidth={2.5} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Farmer Listing Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingListing ? 'विज्ञापन संपादित करें' : t('marketplace.createListing')}
          maxWidth="640px"
        >
          {formError && (
            <div className="alert alert-danger" style={{ marginBottom: 'var(--space-md)' }}>
              <AlertCircle size={20} strokeWidth={2.5} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitListing}>
            <div className="form-group">
              <label className="form-label">शीर्षक / Item Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="उदा. शरबती गेहूं (A Grade Wheat) या स्वराज ट्रैक्टर किराए पर"
                value={modalForm.title}
                onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">{t('marketplace.category')} *</label>
                <select
                  className="form-select"
                  value={modalForm.category}
                  onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                  required
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">इकाई / Unit *</label>
                <select
                  className="form-select"
                  value={modalForm.unit}
                  onChange={(e) => setModalForm({ ...modalForm, unit: e.target.value })}
                  required
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">मूल्य (₹) / Price *</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="उदा. 2400"
                  value={modalForm.price}
                  onChange={(e) => setModalForm({ ...modalForm, price: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">उपलब्ध मात्रा / Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="उदा. 50"
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
                  placeholder="उदा. मेरठ, उत्तर प्रदेश"
                  value={modalForm.location}
                  onChange={(e) => setModalForm({ ...modalForm, location: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">संपर्क फोन नंबर / Phone *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="उदा. 9876543210"
                  value={modalForm.contactPhone}
                  onChange={(e) => setModalForm({ ...modalForm, contactPhone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">विवरण / Description</label>
              <textarea
                className="form-textarea"
                placeholder="फसल की गुणवत्ता, किस्म, डिलीवरी की शर्त आदि..."
                value={modalForm.description}
                onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">फोटो लिंक / Image URL (वैकल्पिक)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={modalForm.imageUrl}
                onChange={(e) => setModalForm({ ...modalForm, imageUrl: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsModalOpen(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? t('common.loading') : t('common.submit')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Marketplace;
