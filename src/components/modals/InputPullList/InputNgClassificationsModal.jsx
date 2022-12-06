import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimesCircle, faPlus, faMinus, faCheck, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Hooks
import useWorkOrder from '@/hooks/useWorkOrder';

export default function InputNgClassificationsModal (
        {
            showModal = false,
            setShowModal = () => {},
            lists = [],
            setLists = () => {},
            maximumNumber = 0
        } = {}
    ) {
    // State
    const [isInputNumber, setIsInputNumber] = useState(false);
    const [ngClassifications, setNgClassifications] = useState([]);
    const [currentLists, setCurrentLists] = useState(lists);
    const [selectedRow, setSelectedRow] = useState('');
    const [currentNumber, setCurrentNumber] = useState(0);
    const [maximumCurrentNumber, setMaximumCurrentNumber] = useState(0);

    // Hooks
    const WorkOrder = useWorkOrder();

    // Addons
    const FireSwal = withReactContent(Swal);
    
    const closeModal = () => {
        setShowModal(false);
    }

    const addList = () => {
        const firstNgClassification = ngClassifications[0];

        setCurrentLists([...currentLists, {
            qty: 0,
            ng_code: firstNgClassification?.code ?? '',
            ng_name: firstNgClassification?.name ?? '',
        }]);
    }

    const removeList = (index) => {
        setCurrentLists(currentLists.filter(
            (list, currentIndex) => currentIndex !== index
        ));
    }

    const openInputNumberSection = (row) => {
        setSelectedRow(row);
        
        setCurrentNumber(currentLists[row]?.qty ?? 0);

        setIsInputNumber(true);
    }

    const handleNumberChangeEvent = (number) => {
        let currentNumbers = typeof currentNumber !== 'string' ? currentNumber.toString() : currentNumber;

        if (currentNumbers == 0) {
            currentNumbers = number;
        } else {
            currentNumbers += number;
        }

        currentNumbers = parseInt(currentNumbers) <= parseInt(maximumCurrentNumber) ? currentNumbers : maximumCurrentNumber;

        setCurrentNumber(parseInt(currentNumbers));
    }

    const clearNumberEvent = () => {
        let currentNumbers = typeof currentNumber !== 'string' ? currentNumber.toString() : currentNumber;

        currentNumbers = currentNumbers.split('');
        currentNumbers.pop();

        currentNumbers = currentNumbers.length > 0 ? currentNumbers.join('') : 0;

        setCurrentNumber(currentNumbers);
    }

    const confirmNumberEvent = () => {
        changeQtyList(selectedRow, currentNumber);

        setSelectedRow(null);
        setCurrentNumber(0);

        setIsInputNumber(false);
    }

    const confirmModal = () => {
        try {
            if (currentLists.length > 0) {
                const totalQty = currentLists.map(list => {
                    if (parseInt(list.qty) <= 0) throw new Error('Terdapat input qty yang kurang dari 0');

                    return list.qty;
                }).reduce((prev, cur) => prev + cur);
                if (totalQty <= 0) throw new Error('Total NG Quantity harus lebih dari 0');
                if (totalQty > maximumNumber && maximumNumber > 0) throw new Error(`Total NG Quantity tidak boleh melebihi maksimum. Maximum Quantity : ${maximumNumber}`);
            }
    
            setLists(currentLists);
    
            closeModal();
        } catch (error) {
            return FireSwal.fire({
                icon: 'error',
                title: <strong>Error</strong>,
                html: <span>{ error.message }</span>,
                showConfirmButton: false,
                timer: 3000
            });
        }
    }

    const changeQtyList = (index, value) => {
        const prevList = currentLists;
        
        prevList[index].qty = value >= 0 ? value : 0;

        setCurrentLists(prevList);
    }

    const changeClassificationList = (index, value) => {        
        setCurrentLists(currentLists.map(
            (list, currentIndex) => {
                if (currentIndex === index) {
                    const selectedClassification = ngClassifications.find(classification => classification.code === value);

                    list.ng_code = selectedClassification?.code ?? '';
                    list.ng_name = selectedClassification?.name ?? '';
                }

                return list;
            }
        ));
    }

    useEffect(() => {
        if (!showModal) {
            setIsInputNumber(false);
        }

        if (selectedRow !== '' && typeof selectedRow !== 'undefined' && selectedRow !== null) {
            if (currentLists.length > 0) {
                const maxNumber = maximumNumber - parseInt(
                    currentLists
                        .filter((list, index) => index !== selectedRow)
                        .reduce((prev, curr) => prev + parseInt(curr.qty), 0)
                );
                
                setMaximumCurrentNumber((maxNumber >= 0 ? maxNumber : 0));
            }
        }

        (async() => {
            setNgClassifications(await WorkOrder.getAllNGClassifications());
        })();

        return;
    }, [showModal, selectedRow, currentLists]);

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

                <div className="relative max-h-screen overflow-hidden transform transition-all mx-auto w-full">
                    <div className="p-2 bg-gray-100 border border-gray-400 text-black rounded-lg">
                        {/* Header */}
                        <div className="mb-2">
                            <div className="flex-auto flex items-center justify-between">
                                <span className="text-xs font-extrabold uppercase">
                                    Input NG List
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
                        <div className="relative">
                            {
                                !isInputNumber ? 
                                (
                                    <>
                                        {/* List Section */}
                                        <div className="mb-1 flex items-center justify-end space-x-2">
                                            <button
                                                type="button"
                                                className="px-2 py-1 bg-green-600 hover:bg-green-400 focus:bg-green-800 text-sm text-white rounded-lg focus:outline-none"
                                                onClick={ () => addList() }>
                                                <FontAwesomeIcon icon={ faPlus }/> Tambah Baru
                                            </button>
                                        </div>
                                        <div className="overflow-y-auto overflow-hidden max-h-[75vh] flex flex-col space-y-1">
                                            {
                                                currentLists.length > 0 ? 
                                                currentLists.map((list, index) => {
                                                    return (
                                                        <div key={ `ng_list_${index}` } className="relative px-4 py-5 border border-gray-600 rounded-lg grid grid-cols-2 gap-1">
                                                            <div className="absolute right-0">
                                                                <button
                                                                    type="button"
                                                                    className="px-2 py-1 hover:bg-red-600 focus:bg-red-800 rounded-tr-lg focus:outline-none text-gray-600 hover:text-white focus:text-red-100 cursor-pointer transition"
                                                                    onClick={ (e) => removeList(index) }>
                                                                    <FontAwesomeIcon icon={ faMinus } className="text-sm" />
                                                                </button>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <label htmlFor="ng_qty" className="font-bold text-xs">Qty</label>
                                                                <input
                                                                    type="number"
                                                                    className="p-1 text-sm text-right bg-blue-200 disabled:bg-gray-300 border-2 disabled:border border-blue-400 disabled:border-gray-400 rounded-lg focus:outline-none cursor-pointer"
                                                                    value={ list?.qty ?? 0 }
                                                                    onClick={ () => openInputNumberSection(index) }
                                                                    readOnly />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <label htmlFor="ng_qty" className="font-bold text-xs">Classification</label>
                                                                <select
                                                                    name={ `ng_classification_${index}` }
                                                                    value={ list?.ng_code ?? '' }
                                                                    className="p-1 text-sm bg-blue-200 disabled:bg-gray-300 border-2 disabled:border border-blue-400 disabled:border-gray-400 rounded-lg focus:outline-none"
                                                                    onChange={ (e) => changeClassificationList(index, e.target.value) }>
                                                                    {
                                                                        ngClassifications.map((classification, class_key) => <option key={ `ng_class_opt_${class_key}` } value={ classification.code }>{ `${classification.code} - ${classification.name}` }</option>)
                                                                    }
                                                                </select>
                                                            </div>
                                                        </div>
                                                    );
                                                }) : (
                                                    <div className="p-5 flex items-center justify-center text-sm">
                                                        Tidak ada list yang dimasukkan.
                                                    </div>
                                                )
                                            }
                                        </div>
                                        <div className="mt-1 flex items-center justify-end space-x-2">
                                            <button
                                                type="button"
                                                className="px-2 py-1 bg-gray-300 hover:bg-gray-400 focus:bg-gray-600 text-sm text-gray-800 focus:text-gray-100 rounded-lg focus:outline-none"
                                                onClick={ () => confirmModal() }>
                                                <FontAwesomeIcon icon={ faCheck }/> Konfirmasi
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col space-y-6">
                                        <div className="flex items-center justify-center text-4xl">
                                            { currentNumber } / { maximumCurrentNumber } 
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
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return content();
}