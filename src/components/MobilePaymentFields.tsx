import { networks, phoneHint, type MobileNetwork } from '../payments';
import { FormField } from './FormField';

type Props = {
  network: MobileNetwork | '';
  phone: string;
  onNetwork: (network: MobileNetwork) => void;
  onPhone: (phone: string) => void;
  networkError?: string;
  phoneError?: string;
  idPrefix?: string;
};

/** Network picker + phone number used before a mobile-money prompt is sent. */
export function MobilePaymentFields({ network, phone, onNetwork, onPhone, networkError, phoneError, idPrefix = 'pay' }: Props) {
  return <div className="fc-pay-fields">
    <fieldset>
      <legend>Choose your mobile-money network</legend>
      <div className="fc-network-grid">
        {networks.map(item => <button key={item.id} type="button" aria-pressed={network === item.id} className="fc-network" onClick={() => onNetwork(item.id)}><i style={{ background: item.color }} aria-hidden="true"/><span>{item.label}</span></button>)}
      </div>
      {networkError && <p role="alert" className="text-sm text-red-700 mt-2">{networkError}</p>}
    </fieldset>
    <FormField id={`${idPrefix}-phone`} label="Mobile-money phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" required value={phone} error={phoneError} onChange={e => onPhone(e.target.value)}/>
    <p className="fc-pay-note">{phoneHint} A payment request will appear on this phone. Enter your PIN to approve it. We never see or store your PIN.</p>
  </div>;
}
