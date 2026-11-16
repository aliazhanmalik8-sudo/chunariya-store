import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { Category, Product } from '../../types';
import { formatPrice, getDiscountPercent } from '../../lib/format';
import { adminFetch, uploadAdminImage } from '../../lib/adminApi';
import { SmartImage } from '../SmartImage';

interface CatalogPanelsProps {
  products: Product[];
  categories: Category[];
  currency: string;
  onReload: () => Promise<void>;
  notify: (msg: string) => void;
}

const DEFAULT_SIZE_PRESETS = ['Unstitched', 'XS', 'S', 'M', 'L', 'XL'];

export function ManageProductsPanel({
  products,
  categories,
  currency,
  onReload,
  notify,
}: CatalogPanelsProps) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [sizesText, setSizesText] = useState('Unstitched, S, M, L');
  const [colorsText, setColorsText] = useState('Blush Pink, Ivory');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const openNew = () => {
    setIsNew(true);
    setError(null);
    setEditing({
      name: '',
      description: '',
      fabricDetails: 'Shirt: Pure Lawn · Dupatta: Chiffon · Trouser: Cambric',
      price: 6500,
      discountPrice: null,
      images: [],
      categoryIds: categories[0] ? [categories[0].id] : [],
      sizes: ['Unstitched', 'S', 'M', 'L'],
      colors: ['Blush Pink'],
      stock: 15,
      isAvailable: true,
      isBestSeller: false,
      isNewArrival: true,
      isFeatured: false,
      isTrending: false,
    });
    setSizesText('Unstitched, S, M, L');
    setColorsText('Blush Pink');
  };

  const openEdit = (p: Product) => {
    setIsNew(false);
    setError(null);
    setEditing({ ...p });
    setSizesText(p.sizes.join(', '));
    setColorsText(p.colors.join(', '));
  };

  const handleMultiFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    replaceMain = false,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editing) return;
    setUploading(true);
    setError(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadAdminImage(file);
        uploadedUrls.push(url);
      }
      setEditing((prev) => {
        if (!prev) return prev;
        const currentImages = prev.images || [];
        if (replaceMain && uploadedUrls.length > 0) {
          const rest = currentImages.slice(1);
          return { ...prev, images: [uploadedUrls[0], ...uploadedUrls.slice(1), ...rest] };
        }
        return { ...prev, images: [...currentImages, ...uploadedUrls] };
      });
      notify(`Uploaded ${uploadedUrls.length} image(s). Click Save Product to publish.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const setAsMainImage = (idx: number) => {
    if (!editing || !editing.images || idx <= 0 || idx >= editing.images.length) return;
    const next = [...editing.images];
    const [picked] = next.splice(idx, 1);
    next.unshift(picked);
    setEditing({ ...editing, images: next });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...editing,
        sizes: sizesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        colors: colorsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const url = isNew ? '/api/admin/products' : `/api/admin/products/${editing.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      await adminFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      await onReload();
      setEditing(null);
      notify(isNew ? 'Product added to live store!' : 'Product updated on live store!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setListError(null);
    try {
      await adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      await onReload();
      notify('Product deleted.');
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to delete product.');
    }
  };

  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.fabricDetails.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold text-[#23191B]">Manage Products</h2>
          <p className="text-xs text-[#6E5D60] mt-1">
            Add suits, upload or replace photos, edit names, prices, discounts, sizes, colors, and
            stock.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-5 py-2.5 bg-[#6B1D2F] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#4F1321] transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {listError && (
        <div className="p-3 bg-[#FAF0EE] border border-[#6B1D2F]/40 text-xs text-[#6B1D2F]">
          {listError}
        </div>
      )}

      <div className="flex items-center gap-2 bg-white border border-[#E7DCD5] px-3.5 py-2 max-w-md">
        <Search className="w-4 h-4 text-[#6E5D60]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="flex-1 text-sm bg-transparent focus:outline-none"
        />
      </div>

      <div className="bg-white border border-[#E7DCD5] overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAF0EE] border-b border-[#E7DCD5] text-xs uppercase tracking-wider text-[#6E5D60]">
            <tr>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Categories</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4 text-right">Stock</th>
              <th className="py-3 px-4">Flags</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7DCD5]">
            {filtered.map((p) => {
              const catNames = categories
                .filter((c) => p.categoryIds.includes(c.id))
                .map((c) => c.name);
              return (
                <tr key={p.id} className="hover:bg-[#FCF9F6]">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-14 bg-[#F6EFEA] border border-[#E7DCD5] shrink-0 overflow-hidden">
                        <SmartImage
                          src={p.images[0]}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-[#23191B]">{p.name}</p>
                        <p className="text-xs text-[#6E5D60]">
                          {p.isAvailable ? 'Visible' : 'Hidden'} · {p.sizes.join(', ')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-[#6E5D60] max-w-[200px]">
                    {catNames.length > 0 ? catNames.join(', ') : 'Uncategorized'}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                    <span className="font-semibold text-[#23191B]">
                      {formatPrice(p.discountPrice ?? p.price, currency)}
                    </span>
                    {p.discountPrice && p.discountPrice < p.price && (
                      <span className="block text-xs text-[#6E5D60] line-through">
                        {formatPrice(p.price, currency)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">{p.stock}</td>
                  <td className="py-3 px-4 text-xs text-[#6E5D60]">
                    {[
                      p.isNewArrival ? 'New' : '',
                      p.isBestSeller ? 'Best Seller' : '',
                      p.isTrending ? 'Trending' : '',
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Standard'}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="p-2 text-[#23191B] hover:text-[#6B1D2F]"
                      title="Edit product"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-2 text-[#6E5D60] hover:text-red-700"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Product Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7DCD5] w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-[#E7DCD5] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-display text-2xl font-semibold text-[#23191B]">
                {isNew ? 'Add New Suit' : 'Edit Product'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1.5 text-[#6E5D60] hover:text-[#23191B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-[#FAF0EE] border border-[#6B1D2F]/40 text-xs text-[#6B1D2F]">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editing.name || ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm focus:outline-none focus:border-[#6B1D2F]"
                />
              </div>

              {/* Multi-Image Uploader */}
              <div className="border border-[#E7DCD5] bg-[#FCF9F6] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#23191B]">
                    Product Pictures ({(editing.images || []).length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <label className="px-3.5 py-2 bg-[#23191B] text-white text-xs font-medium cursor-pointer hover:bg-black inline-flex items-center gap-2">
                      <ImagePlus className="w-3.5 h-3.5" />
                      <span>{uploading ? 'Uploading...' : 'Replace Main Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleMultiFileUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                    <label className="px-3.5 py-2 bg-[#6B1D2F] text-white text-xs font-medium cursor-pointer hover:bg-[#4F1321] inline-flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploading ? 'Uploading...' : 'Add More Photos'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleMultiFileUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Or paste an image URL..."
                    className="flex-1 border border-[#E7DCD5] bg-white px-3 py-1.5 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!imageUrlInput.trim()) return;
                      setEditing({
                        ...editing,
                        images: [...(editing.images || []), imageUrlInput.trim()],
                      });
                      setImageUrlInput('');
                    }}
                    className="px-3 py-1.5 border border-[#23191B] text-xs font-medium hover:bg-white"
                  >
                    Add URL
                  </button>
                </div>

                {(editing.images || []).length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                    {(editing.images || []).map((img, idx) => (
                      <div key={`${img}-${idx}`} className="relative aspect-[3/4] border border-[#E7DCD5] bg-white group">
                        <SmartImage src={img} alt="Preview" className="w-full h-full object-cover" />
                        {idx === 0 ? (
                          <span className="absolute bottom-1 left-1 bg-[#6B1D2F] text-white text-[10px] px-1.5 py-0.5 font-medium">
                            Main
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAsMainImage(idx)}
                            title="Set as main product photo"
                            className="absolute bottom-1 left-1 bg-black/75 text-white text-[10px] px-1.5 py-0.5 inline-flex items-center gap-1 hover:bg-[#6B1D2F]"
                          >
                            <Star className="w-2.5 h-2.5" />
                            <span>Set Main</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              ...editing,
                              images: (editing.images || []).filter((_, i) => i !== idx),
                            })
                          }
                          aria-label="Remove image"
                          className="absolute top-1 right-1 bg-black/75 text-white p-1 hover:bg-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Original Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editing.price ?? 0}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                    className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Sale / Discounted Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editing.discountPrice ?? ''}
                    placeholder="Leave blank for none"
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        discountPrice: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editing.stock ?? 0}
                    onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })}
                    className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Fabric Details
                </label>
                <input
                  type="text"
                  value={editing.fabricDetails || ''}
                  onChange={(e) => setEditing({ ...editing, fabricDetails: e.target.value })}
                  className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Sizes (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={sizesText}
                    onChange={(e) => setSizesText(e.target.value)}
                    placeholder="Unstitched, XS, S, M, L, XL"
                    className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {DEFAULT_SIZE_PRESETS.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          const list = sizesText
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                          if (!list.includes(sz)) setSizesText([...list, sz].join(', '));
                        }}
                        className="text-[11px] px-2 py-0.5 bg-[#FAF0EE] border border-[#E7DCD5] hover:border-[#6B1D2F]"
                      >
                        + {sz}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Available Colors (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={colorsText}
                    onChange={(e) => setColorsText(e.target.value)}
                    placeholder="Blush Pink, Ivory, Deep Maroon"
                    className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Assign Categories */}
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider mb-2">
                  Assign to Categories
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-[#E7DCD5] p-3 bg-[#FCF9F6] max-h-40 overflow-y-auto">
                  {categories.map((cat) => {
                    const checked = (editing.categoryIds || []).includes(cat.id);
                    return (
                      <label key={cat.id} className="inline-flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const current = editing.categoryIds || [];
                            const next = checked
                              ? current.filter((id) => id !== cat.id)
                              : [...current, cat.id];
                            setEditing({ ...editing, categoryIds: next });
                          }}
                          className="accent-[#6B1D2F]"
                        />
                        <span>{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-5 pt-2 border-t border-[#E7DCD5] text-xs">
                {[
                  { key: 'isAvailable', label: 'Available on Website' },
                  { key: 'isNewArrival', label: 'New Arrival' },
                  { key: 'isBestSeller', label: 'Best Seller' },
                  { key: 'isFeatured', label: 'Featured' },
                  { key: 'isTrending', label: 'Trending' },
                ].map((flag) => (
                  <label key={flag.key} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editing[flag.key as keyof Product])}
                      onChange={(e) =>
                        setEditing({ ...editing, [flag.key]: e.target.checked })
                      }
                      className="accent-[#6B1D2F]"
                    />
                    <span>{flag.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E7DCD5]">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-5 py-2.5 border border-[#E7DCD5] text-xs font-medium uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-6 py-2.5 bg-[#6B1D2F] text-white text-xs font-medium uppercase hover:bg-[#4F1321] disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function ManageCategoriesPanel({
  categories,
  products,
  onReload,
  notify,
}: {
  categories: Category[];
  products: Product[];
  onReload: () => Promise<void>;
  notify: (msg: string) => void;
}) {
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name?.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const url = isNew ? '/api/admin/categories' : `/api/admin/categories/${editing.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      await adminFetch(url, {
        method,
        body: JSON.stringify(editing),
      });
      await onReload();
      setEditing(null);
      notify(isNew ? 'Category created.' : 'Category updated on live store!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadAdminImage(file);
      setEditing({ ...editing, image: url });
      notify('Category image uploaded — click Save Category to publish.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const toggleVisibility = async (cat: Category) => {
    setListError(null);
    try {
      await adminFetch(`/api/admin/categories/${cat.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ visible: !cat.visible }),
      });
      await onReload();
      notify(cat.visible ? `Hidden "${cat.name}"` : `Shown "${cat.name}"`);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not update category.');
    }
  };

  const moveCategory = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    setListError(null);
    try {
      const reordered = [...categories];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(target, 0, moved);
      await adminFetch('/api/admin/categories/reorder', {
        method: 'POST',
        body: JSON.stringify({ orderedIds: reordered.map((c) => c.id) }),
      });
      await onReload();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not reorder categories.');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Delete category "${cat.name}"? Products will remain safe.`)) return;
    setListError(null);
    try {
      await adminFetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' });
      await onReload();
      notify('Category deleted.');
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not delete category.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold text-[#23191B]">Manage Categories</h2>
          <p className="text-xs text-[#6E5D60] mt-1">
            Create unlimited categories, edit names, upload pictures, reorder display priority, or
            hide/show them anytime.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsNew(true);
            setError(null);
            setEditing({ name: '', description: '', image: '', visible: true });
          }}
          className="px-5 py-2.5 bg-[#6B1D2F] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#4F1321] inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {listError && (
        <div className="p-3 bg-[#FAF0EE] border border-[#6B1D2F]/40 text-xs text-[#6B1D2F]">
          {listError}
        </div>
      )}

      <div className="bg-white border border-[#E7DCD5] divide-y divide-[#E7DCD5]">
        {categories.map((cat, idx) => {
          const count = products.filter((p) => p.categoryIds.includes(cat.id)).length;
          return (
            <div
              key={cat.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FCF9F6]"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-12 bg-[#F6EFEA] border border-[#E7DCD5] overflow-hidden shrink-0">
                  <SmartImage src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#23191B]">
                    {idx + 1}. {cat.name}
                  </p>
                  <p className="text-xs text-[#6E5D60]">
                    {count} {count === 1 ? 'product' : 'products'} ·{' '}
                    {cat.visible ? 'Visible on website' : 'Hidden'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveCategory(idx, -1)}
                  title="Move up"
                  className="p-2 border border-[#E7DCD5] disabled:opacity-30 hover:bg-white"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === categories.length - 1}
                  onClick={() => moveCategory(idx, 1)}
                  title="Move down"
                  className="p-2 border border-[#E7DCD5] disabled:opacity-30 hover:bg-white"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleVisibility(cat)}
                  title={cat.visible ? 'Hide category' : 'Show category'}
                  className="px-3 py-2 border border-[#E7DCD5] text-xs inline-flex items-center gap-1.5 hover:bg-white"
                >
                  {cat.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{cat.visible ? 'Shown' : 'Hidden'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNew(false);
                    setError(null);
                    setEditing({ ...cat });
                  }}
                  className="p-2 border border-[#E7DCD5] hover:text-[#6B1D2F]"
                  title="Edit category"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  className="p-2 border border-[#E7DCD5] text-[#6E5D60] hover:text-red-700"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7DCD5] w-full max-w-lg shadow-2xl">
            <div className="px-6 py-4 border-b border-[#E7DCD5] flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-[#23191B]">
                {isNew ? 'Add Category' : 'Edit Category'}
              </h3>
              <button type="button" onClick={() => setEditing(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-[#FAF0EE] border border-[#6B1D2F]/40 text-xs text-[#6B1D2F]">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editing.name || ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full border border-[#E7DCD5] px-3.5 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider">
                    Category Picture
                  </label>
                  <label className="px-3 py-1.5 bg-[#6B1D2F] text-white text-xs cursor-pointer inline-flex items-center gap-1.5">
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  </label>
                </div>
                <input
                  type="text"
                  value={editing.image || ''}
                  onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  placeholder="Or paste image URL..."
                  className="w-full border border-[#E7DCD5] px-3 py-2 text-xs"
                />
                {editing.image && (
                  <div className="w-32 h-24 border border-[#E7DCD5] overflow-hidden">
                    <SmartImage src={editing.image} alt="Category preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.visible !== false}
                  onChange={(e) => setEditing({ ...editing, visible: e.target.checked })}
                  className="accent-[#6B1D2F]"
                />
                <span>Show category on public website</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E7DCD5]">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 border border-[#E7DCD5] text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-6 py-2 bg-[#6B1D2F] text-white text-xs uppercase disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function BulkCatalogEditorPanel({
  mode,
  products,
  currency,
  onReload,
  notify,
}: {
  mode: 'prices' | 'discounts' | 'stock';
  products: Product[];
  currency: string;
  onReload: () => Promise<void>;
  notify: (msg: string) => void;
}) {
  const buildDrafts = (list: Product[]) => {
    const map: Record<
      string,
      { price: number; discountPrice: string; stock: number; isAvailable: boolean }
    > = {};
    for (const p of list) {
      map[p.id] = {
        price: p.price,
        discountPrice: p.discountPrice ? String(p.discountPrice) : '',
        stock: p.stock,
        isAvailable: p.isAvailable,
      };
    }
    return map;
  };

  const [drafts, setDrafts] = useState<
    Record<string, { price: number; discountPrice: string; stock: number; isAvailable: boolean }>
  >(() => buildDrafts(products));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(buildDrafts(products));
  }, [products]);

  const getDraft = (p: Product) =>
    drafts[p.id] ?? {
      price: p.price,
      discountPrice: p.discountPrice ? String(p.discountPrice) : '',
      stock: p.stock,
      isAvailable: p.isAvailable,
    };

  const setDraft = (
    p: Product,
    patch: Partial<{ price: number; discountPrice: string; stock: number; isAvailable: boolean }>,
  ) => {
    const current = getDraft(p);
    setDrafts((prev) => ({ ...prev, [p.id]: { ...current, ...patch } }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    try {
      const updates = products.map((p) => {
        const d = getDraft(p);
        return {
          id: p.id,
          price: d.price,
          discountPrice: d.discountPrice ? Number(d.discountPrice) : null,
          stock: d.stock,
          isAvailable: d.isAvailable,
        };
      });
      await adminFetch('/api/admin/products/bulk-update', {
        method: 'PATCH',
        body: JSON.stringify({ updates }),
      });
      await onReload();
      notify('All changes saved and published to live storefront.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const titles = {
    prices: {
      title: 'Manage Prices',
      subtitle: 'Quickly adjust regular prices across all suits in one place.',
    },
    discounts: {
      title: 'Manage Discounts',
      subtitle: 'Set or clear promotional sale prices with instant discount percentages.',
    },
    stock: {
      title: 'Manage Stock & Availability',
      subtitle: 'Update inventory quantities or temporarily hide out-of-stock suits.',
    },
  }[mode];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold text-[#23191B]">{titles.title}</h2>
          <p className="text-xs text-[#6E5D60] mt-1">{titles.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 bg-[#6B1D2F] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#4F1321] inline-flex items-center gap-2 self-start sm:self-auto disabled:opacity-60"
        >
          <Check className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#FAF0EE] border border-[#6B1D2F]/40 text-xs text-[#6B1D2F]">
          {error}
        </div>
      )}

      <div className="bg-white border border-[#E7DCD5] overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAF0EE] border-b border-[#E7DCD5] text-xs uppercase tracking-wider text-[#6E5D60]">
            <tr>
              <th className="py-3 px-4">Product</th>
              {mode === 'prices' && (
                <>
                  <th className="py-3 px-4 text-right">Original Price ({currency})</th>
                  <th className="py-3 px-4 text-right">Current Sale Price</th>
                </>
              )}
              {mode === 'discounts' && (
                <>
                  <th className="py-3 px-4 text-right">Original Price</th>
                  <th className="py-3 px-4 text-right">Discounted Price ({currency})</th>
                  <th className="py-3 px-4 text-right">Discount %</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </>
              )}
              {mode === 'stock' && (
                <>
                  <th className="py-3 px-4 text-right">Stock Qty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Available</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7DCD5]">
            {products.map((p) => {
              const d = getDraft(p);
              const discNum = d.discountPrice ? Number(d.discountPrice) : null;
              const pct = getDiscountPercent(d.price, discNum);
              return (
                <tr key={p.id}>
                  <td className="py-3 px-4 font-medium text-[#23191B]">{p.name}</td>

                  {mode === 'prices' && (
                    <>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          min={0}
                          value={d.price}
                          onChange={(e) => setDraft(p, { price: Number(e.target.value) })}
                          className="w-32 border border-[#E7DCD5] px-2.5 py-1.5 text-right tabular-nums"
                        />
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-[#6E5D60]">
                        {discNum ? formatPrice(discNum, currency) : '—'}
                      </td>
                    </>
                  )}

                  {mode === 'discounts' && (
                    <>
                      <td className="py-3 px-4 text-right tabular-nums text-[#6E5D60]">
                        {formatPrice(d.price, currency)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          min={0}
                          value={d.discountPrice}
                          placeholder="None"
                          onChange={(e) => setDraft(p, { discountPrice: e.target.value })}
                          className="w-32 border border-[#E7DCD5] px-2.5 py-1.5 text-right tabular-nums"
                        />
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#6B1D2F]">
                        {pct > 0 ? `${pct}% OFF` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDraft(p, { discountPrice: '' })}
                          className="text-xs text-[#6E5D60] hover:text-[#23191B] underline"
                        >
                          Clear
                        </button>
                      </td>
                    </>
                  )}

                  {mode === 'stock' && (
                    <>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          min={0}
                          value={d.stock}
                          onChange={(e) => setDraft(p, { stock: Number(e.target.value) })}
                          className="w-24 border border-[#E7DCD5] px-2.5 py-1.5 text-right tabular-nums"
                        />
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {d.stock === 0 ? (
                          <span className="text-red-700 font-medium">Out of Stock</span>
                        ) : d.stock <= 5 ? (
                          <span className="text-amber-700 font-medium">Low Stock</span>
                        ) : (
                          <span className="text-emerald-800">Healthy</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="checkbox"
                          checked={d.isAvailable}
                          onChange={(e) => setDraft(p, { isAvailable: e.target.checked })}
                          className="accent-[#6B1D2F] w-4 h-4"
                        />
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
