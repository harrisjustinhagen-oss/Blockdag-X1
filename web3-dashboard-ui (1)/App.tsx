import React, { useState, ReactNode, useRef, useEffect } from 'react';
import { ActiveView } from './types';
import { WalletIcon } from './components/icons/WalletIcon';
import { DeFiIcon } from './components/icons/DeFiIcon';
import { GamesIcon } from './components/icons/GamesIcon';
import { ProfileIcon } from './components/icons/ProfileIcon';
import { QrCodeIcon } from './components/icons/QrCodeIcon';
import { GoogleGenAI } from '@google/genai';

// --- Helper Components ---

interface NavButtonProps {
  label: string;
  icon: ReactNode;
  isActive: boolean;
  onClick: () => void;
  activeColorClass: string;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, isActive, onClick, activeColorClass }) => {
  const activeClasses = `text-white ${activeColorClass}`;
  const inactiveClasses = 'text-slate-400 hover:text-white';

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full py-2 transition-all duration-300 ease-in-out transform hover:scale-105 ${isActive ? activeClasses : inactiveClasses}`}
    >
      {icon}
      <span className={`mt-1 text-xs font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>{label}</span>
    </button>
  );
};

const WalletPanel: React.FC = () => (
    <div className="text-center p-8 animate-fadeIn">
        <h2 className="text-3xl font-bold text-cyan-300 mb-4">Wallet</h2>
        <p className="text-slate-300">Connect and manage your digital assets securely. View your balances, transaction history, and send/receive tokens with ease.</p>
        <img src="https://picsum.photos/seed/wallet/400/200" alt="wallet illustration" className="rounded-lg mt-6 mx-auto opacity-70" />
    </div>
);

const DeFiPanel: React.FC = () => (
    <div className="text-center p-8 animate-fadeIn">
        <h2 className="text-3xl font-bold text-purple-300 mb-4">DeFi Hub</h2>
        <p className="text-slate-300">Explore the world of Decentralized Finance. Swap tokens, provide liquidity, and earn yields on your crypto assets.</p>
         <img src="https://picsum.photos/seed/defi/400/200" alt="defi illustration" className="rounded-lg mt-6 mx-auto opacity-70" />
    </div>
);

const GamesPanel: React.FC = () => (
    <div className="text-center p-8 animate-fadeIn">
        <h2 className="text-3xl font-bold text-amber-300 mb-4">Game Center</h2>
        <p className="text-slate-300">Dive into blockchain gaming. Discover new titles, manage your in-game assets, and compete for rewards.</p>
         <img src="https://picsum.photos/seed/games/400/200" alt="games illustration" className="rounded-lg mt-6 mx-auto opacity-70" />
    </div>
);

// --- Avatar Creator Component ---
const AvatarCreator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [avatarDescription, setAvatarDescription] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                let message = 'Could not access camera. Please check permissions and try again.';
                if (err instanceof DOMException) {
                    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                        message = "No camera found on this device. Please connect a camera and try again.";
                    } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                        message = "Camera access denied. Please enable camera permissions in your browser settings.";
                    } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                        message = "The camera is currently in use by another application.";
                    }
                }
                setError(message);
            }
        };
        if (!capturedImage) {
            startCamera();
        }

        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [capturedImage]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current && !error) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            
            const imageDataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImage(imageDataUrl);
            stream?.getTracks().forEach(track => track.stop());
            generateAvatarDescription(imageDataUrl);
        }
    };
    
    const generateAvatarDescription = async (imageDataUrl: string) => {
        setIsLoading(true);
        setError('');
        setAvatarDescription('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const base64Data = imageDataUrl.split(',')[1];
            const imagePart = {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                }
            };
            const textPart = { text: 'Analyze this face and create a detailed, lifelike avatar description from it.' };
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] }
            });
            
            setAvatarDescription(response.text);

        } catch (err) {
            console.error("Gemini API error:", err);
            setError('Failed to generate avatar description. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 flex flex-col items-center justify-center h-full animate-fadeIn">
            {!capturedImage ? (
                <>
                    <h2 className="text-xl font-bold text-green-300 mb-2">Create Your Avatar</h2>
                    <p className="text-sm text-slate-400 mb-4">Position your face in the frame and capture.</p>
                    <div className="w-full aspect-square bg-black rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        {error && (
                            <div className="absolute text-center p-4">
                               <p className="text-red-400">{error}</p>
                            </div>
                        )}
                    </div>
                    
                    <button onClick={handleCapture} disabled={!!error} className="mt-6 px-6 py-2 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors duration-300 shadow-lg shadow-green-500/30 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none">
                        Capture
                    </button>
                </>
            ) : (
                <div className="text-center flex flex-col items-center w-full">
                     <h2 className="text-xl font-bold text-green-300 mb-4">Your Captured Image</h2>
                    <img src={capturedImage} alt="captured face" className="w-48 h-48 rounded-lg object-cover mb-4 shadow-lg" />
                    {isLoading && (
                        <div className="flex items-center space-x-2 text-slate-300">
                             <div className="w-4 h-4 border-2 border-t-transparent border-green-400 rounded-full animate-spin"></div>
                             <span>Generating description...</span>
                        </div>
                    )}
                    {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                    {avatarDescription && (
                        <div className="mt-4 p-4 bg-slate-900/50 rounded-lg text-left w-full max-w-sm">
                            <h3 className="font-bold text-green-400 mb-2">Avatar Description:</h3>
                            <p className="text-slate-300 text-sm whitespace-pre-wrap">{avatarDescription}</p>
                        </div>
                    )}
                </div>
            )}
             <canvas ref={canvasRef} className="hidden" />
             <button onClick={onBack} className="mt-6 px-6 py-2 bg-slate-600 text-white font-semibold rounded-full hover:bg-slate-500 transition-colors duration-300 transform hover:scale-105">
                Back to Profile
            </button>
        </div>
    );
};


// --- Profile Panel ---
const ProfilePanel: React.FC<{ onAvatarCreate: () => void }> = ({ onAvatarCreate }) => (
    <div className="p-8 animate-fadeIn">
        <div className="flex justify-start mb-6">
            <img 
                src="https://picsum.photos/seed/avatar/100" 
                alt="profile avatar"
                className="w-24 h-24 rounded-full border-4 border-green-400 object-cover shadow-lg"
            />
        </div>
        <div className="text-center">
            <h2 className="text-3xl font-bold text-green-300 mb-4">Profile</h2>
            <p className="text-slate-300">View and edit your profile details, manage your settings, and track your achievements across the platform.</p>
            <div className="mt-6 flex justify-center space-x-4">
                <button onClick={onAvatarCreate} className="px-6 py-2 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors duration-300 shadow-lg shadow-green-500/30 transform hover:scale-105">
                    Create Avatar
                </button>
                <button className="px-6 py-2 bg-slate-600 text-white font-semibold rounded-full hover:bg-slate-500 transition-colors duration-300 transform hover:scale-105">
                    Edit Avatar
                </button>
            </div>
            <img src="https://picsum.photos/seed/profile/400/200" alt="profile illustration" className="rounded-lg mt-8 mx-auto opacity-70" />
        </div>
    </div>
);


// --- QR Code Modal Component ---
const QrCodeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [appUrl, setAppUrl] = useState('');

    useEffect(() => {
        setAppUrl(window.location.href);
    }, []);

    if (!appUrl) return null;

    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(appUrl)}&qzone=1&bgcolor=1e293b&color=e2e8f0`;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-slate-200 mb-2">Scan to open on mobile</h3>
                <p className="text-sm text-slate-400 mb-4">Point your phone's camera at this QR code.</p>
                <div className="p-2 bg-slate-900 rounded-lg inline-block">
                    <img src={qrCodeApiUrl} alt="QR Code to open application on a mobile device" width="256" height="256" className="rounded"/>
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('wallet');
  const [isX10, setIsX10] = useState<boolean>(false);
  const [isCreatingAvatar, setIsCreatingAvatar] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const renderContent = () => {
    if (activeView === 'profile' && isCreatingAvatar) {
        return <AvatarCreator onBack={() => setIsCreatingAvatar(false)} />;
    }
      
    switch (activeView) {
      case 'wallet':
        return <WalletPanel />;
      case 'defi':
        return <DeFiPanel />;
      case 'games':
        return <GamesPanel />;
      case 'profile':
        return <ProfilePanel onAvatarCreate={() => setIsCreatingAvatar(true)} />;
      default:
        return <WalletPanel />;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white font-sans">
      {showQrModal && <QrCodeModal onClose={() => setShowQrModal(false)} />}
      <div className="w-full max-w-md h-[90vh] max-h-[700px] bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col border border-slate-700">
        
        <header className="p-4 flex items-center justify-between border-b border-slate-700">
            <div className="w-8"></div>
            <h1 className="text-xl font-bold text-slate-200">blockDAG</h1>
            <button 
                onClick={() => setShowQrModal(true)} 
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Show QR Code"
            >
                <QrCodeIcon className="w-6 h-6" />
            </button>
        </header>

        <main key={`${activeView}-${isCreatingAvatar}`} className="flex-grow overflow-y-auto">
          {renderContent()}
        </main>
        
        <nav className="flex justify-around items-center p-2 bg-slate-900/70 border-t border-slate-700 backdrop-blur-sm">
          <div className="flex-1 flex justify-center">
             <button
                onClick={() => setIsX10(!isX10)}
                className={`w-24 h-10 rounded-full font-bold text-sm transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center
                    ${isX10
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }
                `}
            >
                X Series
            </button>
          </div>

          <div className="w-px h-10 bg-slate-700 mx-2"></div>
          
          <div className="flex-grow flex justify-around">
            <NavButton
              label="Wallet"
              icon={<WalletIcon className="w-6 h-6" />}
              isActive={activeView === 'wallet'}
              onClick={() => setActiveView('wallet')}
              activeColorClass="text-cyan-400"
            />
            <NavButton
              label="DeFi"
              icon={<DeFiIcon className="w-6 h-6" />}
              isActive={activeView === 'defi'}
              onClick={() => setActiveView('defi')}
              activeColorClass="text-purple-400"
            />
            <NavButton
              label="Games"
              icon={<GamesIcon className="w-6 h-6" />}
              isActive={activeView === 'games'}
              onClick={() => setActiveView('games')}
              activeColorClass="text-amber-400"
            />
            <NavButton
              label="Profile"
              icon={<ProfileIcon className="w-6 h-6" />}
              isActive={activeView === 'profile'}
              onClick={() => setActiveView('profile')}
              activeColorClass="text-green-400"
            />
          </div>
        </nav>
      </div>
    </div>
  );
};

export default App;