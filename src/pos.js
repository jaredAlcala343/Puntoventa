import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './style.css';

const POS = () => {
    const [transactions, setTransactions] = useState([]);
    const [currentTransaction, setCurrentTransaction] = useState([]);
    const [productName, setProductName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [editProductIndex, setEditProductIndex] = useState(null);

    useEffect(() => {
        const storedTransactions = localStorage.getItem('transactions');
        if (storedTransactions) {
            setTransactions(JSON.parse(storedTransactions));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }, [transactions]);

    const handleAddProduct = () => {
        const newProduct = {
            productName,
            quantity: Number(quantity),
            price: Number(price),
            total: Number(quantity) * Number(price),
        };
        if (editProductIndex !== null) {
            const updatedTransaction = currentTransaction.map((product, index) =>
                index === editProductIndex ? newProduct : product
            );
            setCurrentTransaction(updatedTransaction);
            setEditProductIndex(null);
        } else {
            setCurrentTransaction([...currentTransaction, newProduct]);
        }
        setProductName('');
        setQuantity('');
        setPrice('');
    };

    const handleEditProduct = (index) => {
        const productToEdit = currentTransaction[index];
        setProductName(productToEdit.productName);
        setQuantity(productToEdit.quantity);
        setPrice(productToEdit.price);
        setEditProductIndex(index);
    };

    const handleDeleteProduct = (index) => {
        const updatedTransaction = currentTransaction.filter((_, i) => i !== index);
        setCurrentTransaction(updatedTransaction);
    };

    const handleSaveTransaction = () => {
        const newTransaction = {
            products: currentTransaction,
            date: new Date().toLocaleString(),
        };
        setTransactions([...transactions, newTransaction]);
        setCurrentTransaction([]);
    };

    const handleGeneratePDF = () => {
        const doc = new jsPDF();
        doc.text("Reporte de Transacciones", 10, 10);

        transactions.forEach((transaction, index) => {
            const tableColumn = ["Producto", "Cantidad", "Precio", "Total"];
            const tableRows = [];

            transaction.products.forEach(product => {
                const productData = [
                    product.productName,
                    product.quantity,
                    product.price,
                    product.total,
                ];
                tableRows.push(productData);
            });

            autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 + (index * 50) });
            doc.text(`Transacción ${index + 1}`, 10, 15 + (index * 50));
            doc.text(`Fecha: ${transaction.date}`, 10, 25 + (index * 50) + tableRows.length * 10);
            doc.text(`Total: ${transaction.products.reduce((sum, product) => sum + product.total, 0)}`, 10, 30 + (index * 50) + tableRows.length * 10);
        });

        doc.save("reporte_transacciones.pdf");
    };

    const handlePrintTicket = (transaction) => {
        const doc = new jsPDF();
        doc.text("Ticket de Compra", 10, 10);

        let yOffset = 20; // Starting y position
        let totalAmount = 0;

        transaction.products.forEach((product, index) => {
            doc.text(`Producto: ${product.productName}`, 10, yOffset + (index * 30));
            doc.text(`Cantidad: ${product.quantity}`, 10, yOffset + 10 + (index * 30));
            doc.text(`Precio: ${product.price}`, 10, yOffset + 20 + (index * 30));
            doc.text(`Total: ${product.total}`, 10, yOffset + 30 + (index * 30));
            yOffset += 40; // Adjust y position for the next product
            totalAmount += product.total;
        });

        yOffset += 10; // Space before printing total amount
        doc.text(`Total de la Transacción: ${totalAmount}`, 10, yOffset);
        doc.text(`Fecha: ${transaction.date}`, 10, yOffset + 10);
        doc.save(`ticket_${transaction.date.replace(/[: ]/g, '_')}.pdf`);
    };

    const handleCloseDay = () => {
        handleGeneratePDF();
        setTransactions([]);
        localStorage.removeItem('transactions');
    };

    return (
        <div className="container">
            <h1>Punto de Venta</h1>
            <div className="main-content">
                <div className="products">
                    <h2>Productos en la Transacción Actual</h2>
                    {currentTransaction.length === 0 ? (
                        <p>No hay productos agregados.</p>
                    ) : (
                        <div className="transactions">
                            {currentTransaction.map((product, index) => (
                                <div key={index} className="transaction">
                                    <p><strong>Producto:</strong> {product.productName}</p>
                                    <p><strong>Cantidad:</strong> {product.quantity}</p>
                                    <p><strong>Precio:</strong> {product.price}</p>
                                    <p><strong>Total:</strong> {product.total}</p>
                                    <button onClick={() => handleEditProduct(index)}>Editar</button>
                                    <button onClick={() => handleDeleteProduct(index)}>Eliminar</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="transactions-list">
                    <h2>Transacciones</h2>
                    {transactions.length === 0 ? (
                        <p>No hay transacciones registradas.</p>
                    ) : (
                        <div className="transactions">
                            {transactions.map((transaction, index) => (
                                <div key={index} className="transaction">
                                    <h3>Transacción {index + 1}</h3>
                                    {transaction.products.map((product, productIndex) => (
                                        <div key={productIndex}>
                                            <p><strong>Producto:</strong> {product.productName}</p>
                                            <p><strong>Cantidad:</strong> {product.quantity}</p>
                                            <p><strong>Precio:</strong> {product.price}</p>
                                            <p><strong>Total:</strong> {product.total}</p>
                                        </div>
                                    ))}
                                    <p><strong>Total de la Transacción:</strong> {transaction.products.reduce((sum, product) => sum + product.total, 0)}</p>
                                    <p><strong>Fecha:</strong> {transaction.date}</p>
                                    <button onClick={() => handlePrintTicket(transaction)}>Imprimir Ticket</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="form">
                <div className="form-group">
                    <label>Nombre del Producto</label>
                    <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Cantidad</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Precio</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </div>
                <button onClick={handleAddProduct}>{editProductIndex !== null ? 'Actualizar Producto' : 'Agregar Producto'}</button>
                <button onClick={handleSaveTransaction}>Guardar Transacción</button>
                <button onClick={handleCloseDay}>Cerrar Caja</button>
            </div>
            <footer>
                <p>Desarrollada por KZ Studios. Derechos reservados 2024</p>
            </footer>
        </div>
    );
};

export default POS;
