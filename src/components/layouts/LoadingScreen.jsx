export default function LoadingScreen({ isLoading = false }) {
    return (
        <>
            {
                isLoading && (
                    <div className="fixed inset-0 overflow-y-auto flex items-center transition z-50">
                        <div
                            className="fixed inset-0 transform transition-all">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
        
                        <div className="overflow-hidden transform transition-all mx-auto">
                            <span className="text-white text-xl">
                                Loading
                            </span>
                        </div>
                    </div>
                )
            }
        </>
    );
}