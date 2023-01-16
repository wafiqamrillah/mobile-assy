import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faArrowLeft, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

export default function InputGoodQtyModal (
        {
            showModal = false,
            setShowModal = () => {},
            setQty = () => {},
            initialValue = 0,
            maximumValue = 0
        } = {}
    ) {
    // Modal Props
    const [value, setValue] = useState(0);
    
    const closeModal = () => {
        setShowModal(false);
    }

    const handleNumberChangeEvent = (number) => {
        let currentNumbers = typeof value !== 'string' ? value.toString() : value;

        if (currentNumbers == 0) {
            currentNumbers = number;
        } else {
            currentNumbers += number;
        }

        if (maximumValue > 0) {
            currentNumbers = parseInt(currentNumbers) <= parseInt(maximumValue) ? currentNumbers : maximumValue;
        }

        setValue(currentNumbers);
    }

    const clearNumberEvent = () => {
        let currentNumbers = typeof value !== 'string' ? value.toString() : value;

        currentNumbers = currentNumbers.split('');
        currentNumbers.pop();

        currentNumbers = currentNumbers.length > 0 ? currentNumbers.join('') : 0;

        setValue(currentNumbers);
    }

    const confirmNumberEvent = () => {
        setQty(parseInt(value));

        closeModal();
    }

    const content = () => {
        if (!showModal) {
            return null;
        }

        return (
            <div className="fixed inset-0 flex items-center transition z-50">
                <div
                    className="fixed inset-0 transform transition-all">
                    <div className="absolute inset-0 bg-black opacity-75"></div>
                </div>

                <div className="overflow-hidden transform transition-all mx-auto">
                    <div className="p-2 bg-gray-100 border border-gray-400 text-black rounded-lg">
                        {/* Header */}
                        <div className="mb-2">
                            <div className="flex-auto flex items-center justify-between">
                                <span className="text-xs font-extrabold uppercase">
                                    Input Good Quantity
                                </span>

                                <button
                                    type="button"
                                    onClick={ () => closeModal() }
                                    className="text-xl text-red-600 hover:text-red-300 focus:text-red-900 focus:outline-none">
                                    <FontAwesomeIcon icon={ faTimesCircle } />
                                </button>
                            </div>
                            <hr className="h-[2px] bg-gray-400 rounded-sm" />
                        </div>

                        {/* Body */}
                        <div className="flex flex-col space-y-6">
                            <div className="flex items-center justify-center text-4xl">
                                { value } / { (maximumValue > 0 ? `${maximumValue}` : 0 ) }
                            </div>
                            
                            <div className="w-full grid grid-cols-3 gap-2">
                                {
                                    ([1, 2, 3, 4, 5, 6, 7, 8, 9]).map((number) => {
                                        return (
                                            <button
                                                key={ `numpad${number}` }
                                                type="button"
                                                onClick={ () => handleNumberChangeEvent(`${number}`) }
                                                className="px-6 py-2 bg-gray-400 hover:bg-gray-300 focus:bg-gray-600 rounded-xl text-2xl text-center font-semibold focus:outline-none">
                                                { number }
                                            </button>
                                        );
                                    })
                                }
                                
                                {/* Clear Button */}
                                <button
                                    type="button"
                                    onClick={ () => clearNumberEvent() }
                                    className="px-6 py-2 bg-gray-400 hover:bg-gray-300 focus:bg-gray-600 rounded-xl text-2xl text-center font-semibold focus:outline-none">
                                    <FontAwesomeIcon icon={ faArrowLeft }/>
                                </button>

                                {/* Zero Number Button */}
                                <button
                                    type="button"
                                    onClick={ () => handleNumberChangeEvent("0") }
                                    className="px-6 py-2 bg-gray-400 hover:bg-gray-300 focus:bg-gray-600 rounded-xl text-2xl text-center font-semibold focus:outline-none">
                                    0
                                </button>
                                
                                {/* Confirm Button */}
                                <button
                                    type="button"
                                    onClick={ () => confirmNumberEvent() }
                                    className="px-6 py-2 bg-gray-400 hover:bg-gray-300 focus:bg-gray-600 rounded-xl text-2xl text-center font-semibold focus:outline-none">
                                    <FontAwesomeIcon icon={ faCheck }/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    useEffect(() => {
        setValue((showModal ? initialValue : 0));

        return;
    }, [showModal, initialValue]);

    return (
        <>
            {
                content()
            }
        </>
    );
}