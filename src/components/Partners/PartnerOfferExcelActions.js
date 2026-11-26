'use client';

import { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowDown, faFileArrowUp } from '@fortawesome/free-solid-svg-icons';

export default function PartnerOfferExcelActions({ importAction }) {
  const file = useRef(null);
  return <div className="partner-excel-actions">
    <a className="partner-excel-button partner-excel-download" href="/api/partner-offers/export">
      <FontAwesomeIcon icon={faFileArrowDown} />
      <span>دریافت خروجی</span>
    </a>
    <form action={importAction}>
      <input ref={file} className="partner-excel-file" type="file" name="file" accept=".csv,text/csv" required
        onChange={event => { if (event.target.files?.length) event.currentTarget.form?.requestSubmit(); }} />
      <button className="partner-excel-button partner-excel-upload" type="button" onClick={() => file.current?.click()}>
        <FontAwesomeIcon icon={faFileArrowUp} />
        <span>ورود اطلاعات</span>
      </button>
    </form>
  </div>;
}
