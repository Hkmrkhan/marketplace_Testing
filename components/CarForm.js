import { useState } from 'react';

export default function CarForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [miles, setMiles] = useState('');
  const [reg_district, setRegDistrict] = useState('');
  const [year, setYear] = useState('');
  const [images, setImages] = useState(['', '', '', '']);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const hasFormData = () => {
    return title.trim() || description.trim() || price.trim() || miles.trim() || 
           reg_district.trim() || year.trim() || images.some(img => img.trim() !== '') || videoFile;
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setMiles('');
    setRegDistrict('');
    setYear('');
    setImages(['', '', '', '']);
    setVideoFile(null);
    setVideoPreview('');
  };

  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file (MP4, AVI, MOV, etc.)');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('Video file size must be less than 50MB');
        return;
      }
      setVideoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    }
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    onCancel();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validImages = images.filter(img => img.trim() !== '');
    if (validImages.length === 0) {
      alert('Please add at least one image for your car.');
      return;
    }
    onSubmit({ title, description, price, miles, reg_district, year, images: validImages, videoFile }, resetForm);
  };

  return (
    <div className="rounded-3xl backdrop-blur-2xl bg-slate-900/80 border border-white/10 p-6 sm:p-10 shadow-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Add Your Car Details</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Fill in the information below to list your car</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Car Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Toyota Corolla 2020"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Description <span className="text-rose-400">*</span>
          </label>
          <textarea
            placeholder="Describe your car's features, condition, and any special details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows="4"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Price ($) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              placeholder="15000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min="0"
              step="100"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Miles <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              placeholder="50000"
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min="0"
              step="1000"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Year <span className="text-rose-400">*</span>
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Year</option>
              {Array.from({ length: 45 }, (_, i) => 2024 - i).map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Registration City <span className="text-rose-400">*</span>
            </label>
            <select
              value={reg_district}
              onChange={(e) => setRegDistrict(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select City</option>
              {['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot', 'Other'].map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
            Car Video (Optional)
          </label>
          <p className="text-[11px] text-slate-400 mb-2">Upload a video to showcase your car (MP4, AVI, MOV - Max 50MB)</p>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/15 text-slate-300 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
          />
          {videoPreview && (
            <div className="mt-4">
              <video
                src={videoPreview}
                controls
                className="w-full max-w-sm rounded-2xl border border-white/10"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
            Car Images (Up to 5) <span className="text-rose-400">*</span>
          </label>
          <p className="text-[11px] text-slate-400 mb-3">Add image URLs for your car. At least one image is required.</p>
          
          <div className="space-y-3">
            {images.map((image, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs text-slate-400 sm:w-24">
                  Image {index + 1} {index === 0 && <span className="text-rose-400">*</span>}
                </span>
                <input
                  type="url"
                  placeholder={`https://example.com/car-image-${index + 1}.jpg`}
                  value={image}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required={index === 0}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/10">
          <button 
            type="submit" 
            className="px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all cursor-pointer text-sm"
          >
            Add Car to Marketplace
          </button>

          <div>
            {hasFormData() ? (
              <button 
                type="button" 
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
              >
                Cancel
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => window.history.back()}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 transition-all cursor-pointer"
              >
                Back
              </button>
            )}
          </div>
        </div>

        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/20 p-6 shadow-2xl text-center">
              <h3 className="text-base font-bold text-white mb-2">Are you sure you want to cancel?</h3>
              <p className="text-xs text-slate-400 mb-6">All entered details will be lost.</p>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={confirmCancel}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer"
                >
                  Yes
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
