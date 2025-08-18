import { useState } from 'react';
import styles from '../styles/CarForm.module.css';

export default function CarForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [miles, setMiles] = useState('');
  const [reg_district, setRegDistrict] = useState('');
  const [year, setYear] = useState('');
  const [images, setImages] = useState(['', '', '', '']); // 4 additional images
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Check if form has any data
  const hasFormData = () => {
    return title.trim() || description.trim() || price.trim() || miles.trim() || 
           reg_district.trim() || year.trim() || images.some(img => img.trim() !== '');
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setMiles('');
    setRegDistrict('');
    setYear('');
    setImages(['', '', '', '']);
  };

  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
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
    // Filter out empty image URLs and ensure at least one image
    const validImages = images.filter(img => img.trim() !== '');
    if (validImages.length === 0) {
      alert('Please add at least one image for your car.');
      return;
    }
    onSubmit({ title, description, price, miles, reg_district, year, images: validImages }, resetForm);
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>Add Your Car Details</h2>
        <p>Fill in the information below to list your car</p>
      </div>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Car Title <span className={styles.required}>*</span></label>
          <input
            type="text"
            placeholder="e.g., Toyota Corolla 2020"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description <span className={styles.required}>*</span></label>
          <textarea
            placeholder="Describe your car's features, condition, and any special details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textarea}
            rows="4"
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Price ($) <span className={styles.required}>*</span></label>
            <input
              type="number"
              placeholder="15000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={styles.input}
              min="0"
              step="100"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Miles <span className={styles.required}>*</span></label>
            <input
              type="number"
              placeholder="50000"
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
              className={styles.input}
              min="0"
              step="1000"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Year <span className={styles.required}>*</span></label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={styles.input}
              required
            >
              <option value="">Select Year</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="2019">2019</option>
              <option value="2018">2018</option>
              <option value="2017">2017</option>
              <option value="2016">2016</option>
              <option value="2015">2015</option>
              <option value="2014">2014</option>
              <option value="2013">2013</option>
              <option value="2012">2012</option>
              <option value="2011">2011</option>
              <option value="2010">2010</option>
              <option value="2009">2009</option>
              <option value="2008">2008</option>
              <option value="2007">2007</option>
              <option value="2006">2006</option>
              <option value="2005">2005</option>
              <option value="2004">2004</option>
              <option value="2003">2003</option>
              <option value="2002">2002</option>
              <option value="2001">2001</option>
              <option value="2000">2000</option>
              <option value="1999">1999</option>
              <option value="1998">1998</option>
              <option value="1997">1997</option>
              <option value="1996">1996</option>
              <option value="1995">1995</option>
              <option value="1994">1994</option>
              <option value="1993">1993</option>
              <option value="1992">1992</option>
              <option value="1991">1991</option>
              <option value="1990">1990</option>
              <option value="1989">1989</option>
              <option value="1988">1988</option>
              <option value="1987">1987</option>
              <option value="1986">1986</option>
              <option value="1985">1985</option>
              <option value="1984">1984</option>
              <option value="1983">1983</option>
              <option value="1982">1982</option>
              <option value="1981">1981</option>
              <option value="1980">1980</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Registration City <span className={styles.required}>*</span></label>
            <select
              value={reg_district}
              onChange={(e) => setRegDistrict(e.target.value)}
              className={styles.input}
              required
            >
              <option value="">Select City</option>
              <option value="Karachi">Karachi</option>
              <option value="Lahore">Lahore</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Rawalpindi">Rawalpindi</option>
              <option value="Faisalabad">Faisalabad</option>
              <option value="Multan">Multan</option>
              <option value="Peshawar">Peshawar</option>
              <option value="Quetta">Quetta</option>
              <option value="Gujranwala">Gujranwala</option>
              <option value="Sialkot">Sialkot</option>
              <option value="Bahawalpur">Bahawalpur</option>
              <option value="Sargodha">Sargodha</option>
              <option value="Sukkur">Sukkur</option>
              <option value="Larkana">Larkana</option>
              <option value="Sheikhupura">Sheikhupura</option>
              <option value="Rahim Yar Khan">Rahim Yar Khan</option>
              <option value="Jhang">Jhang</option>
              <option value="Gujrat">Gujrat</option>
              <option value="Mardan">Mardan</option>
              <option value="Kasur">Kasur</option>
              <option value="Dera Ghazi Khan">Dera Ghazi Khan</option>
              <option value="Sahiwal">Sahiwal</option>
              <option value="Nawabshah">Nawabshah</option>
              <option value="Mirpur Khas">Mirpur Khas</option>
              <option value="Okara">Okara</option>
              <option value="Mandi Bahauddin">Mandi Bahauddin</option>
              <option value="Jacobabad">Jacobabad</option>
              <option value="Saddiqabad">Saddiqabad</option>
              <option value="Muzaffargarh">Muzaffargarh</option>
              <option value="Murree">Murree</option>
              <option value="Abbottabad">Abbottabad</option>
              <option value="Jhelum">Jhelum</option>
              <option value="Mianwali">Mianwali</option>
              <option value="Toba Tek Singh">Toba Tek Singh</option>
              <option value="Khanewal">Khanewal</option>
              <option value="Dera Ismail Khan">Dera Ismail Khan</option>
              <option value="Vehari">Vehari</option>
              <option value="Nowshera">Nowshera</option>
              <option value="Charsadda">Charsadda</option>
              <option value="Jampur">Jampur</option>
              <option value="Attock">Attock</option>
              <option value="Kot Addu">Kot Addu</option>
              <option value="Rawalakot">Rawalakot</option>
              <option value="Gilgit">Gilgit</option>
              <option value="Skardu">Skardu</option>
              <option value="Chitral">Chitral</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Car Images (Up to 5) <span className={styles.required}>*</span></label>
            <p className={styles.helperText}>Add image URLs for your car. At least one image is required.</p>
            
            {images.map((image, index) => (
              <div key={index} className={styles.imageInputGroup}>
                <label className={styles.imageLabel}>
                  Image {index + 1} {index === 0 && <span className={styles.required}>*</span>}
                </label>
                <input
                  type="url"
                  placeholder={`https://example.com/car-image-${index + 1}.jpg`}
                  value={image}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  className={styles.input}
                  required={index === 0} // Only first image is required
                />
              </div>
            ))}
          </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn}>
            Add Car to Marketplace
          </button>
          <div className={styles.buttonGroup}>
            {/* Show Cancel button only when form has data */}
            {hasFormData() && (
              <button 
                type="button" 
                className={styles.cancelBtn}
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}
            {/* Show Back button only when form has no data */}
            {!hasFormData() && (
              <button 
                type="button" 
                className={styles.backBtn}
                onClick={() => window.history.back()}
              >
                Back
              </button>
            )}
          </div>
        </div>

        {/* Cancel Confirmation Dialog */}
        {showCancelConfirm && (
          <div className={styles.confirmationDialog}>
            <div className={styles.confirmationContent}>
              <h3>Are you sure you want to cancel?</h3>
              <p>All your entered data will be lost.</p>
              <div className={styles.confirmationButtons}>
                <button 
                  type="button" 
                  className={styles.confirmBtn}
                  onClick={confirmCancel}
                >
                  Yes
                </button>
                <button 
                  type="button" 
                  className={styles.denyBtn}
                  onClick={() => setShowCancelConfirm(false)}
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
