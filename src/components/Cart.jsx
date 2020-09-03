import React, { useState, useEffect, useRef, useContext } from 'react';
import CartView from './CartView';
import { CartContext } from '../context/CartContext';

export default function Cart() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [notDiscounted, setNotDiscounted] = useState(true);
  const orderName = useRef();
  const couponCode = useRef();
  const { setProductIds } = useContext(CartContext);

  function mapIdsToUrl() {
    //Converts array of ids and quantity to array with fetch urls and quantity
    let list;
    if (localStorage.getItem('cart')) {
      list = JSON.parse(localStorage.getItem('cart')).map((product) => {
        return {
          url: `https://mock-data-api.firebaseio.com/e-commerce/products/${product.id}.json`,
          quantity: product.quantity,
        };
      });
    }
    return list;
  }

  function fetchAllProducts() {
    let urls = mapIdsToUrl();
    if (urls.length === 0) {
      setIsLoading(false);
    } else {
      // Fetches all products from database by using product id in correct endpoint (see mapIdsToUrl function)
      Promise.all(
        urls.map((url) =>
          fetch(url.url)
            .then((res) => res.json())
            .then((data) => {
              setProducts((prevState) => [
                ...prevState,
                { item: data, quantity: url.quantity },
              ]);
              setIsLoading(false);
            })
        )
      );
    }
  }
  function handleRemove(productId) {
    //Removes item from state by filtering current depending array
    setProductIds((prevState) =>
      prevState.filter((product) => product.id !== productId)
    );
    setProducts((prevState) =>
      prevState.filter((product) => product.item.id !== productId)
    );
    //Removes item from local storage
    let store = JSON.parse(localStorage.getItem('cart')).filter(
      (item) => item.id !== productId
    );
    localStorage.setItem('cart', JSON.stringify(store));
  }

  function setTotalPrice() {
    // When products are fetched from endpoint they are reduced to the total price
    let totalPrice = products.reduce(
      (acc, curr) => acc + curr.item.price * curr.quantity,
      0
    );
    setTotal(totalPrice);
  }
  function fetchCouponCodes() {
    fetch(`https://mock-data-api.firebaseio.com/e-commerce/couponCodes.json`)
      .then((res) => res.json())
      .then((data) => {
        setCoupons(data);
      });
  }
  function addCoupon() {
    if (
      products.length > 0 &&
      Object.entries(coupons).find(
        (item) => item[0] === couponCode.current.value && notDiscounted
      )
    ) {
      const discount = coupons[couponCode.current.value].discount;
      setTotal((prevState) => Math.floor(prevState * discount));
      setNotDiscounted(false);
    } else {
      alert('Coupon does not exist');
    }
  }
  function clearCart() {
    localStorage.setItem('cart', JSON.stringify([]));
  }
  function handlePlaceOrder() {
    const url = `https://mock-data-api.firebaseio.com/e-commerce/orders/group-7.json`;
    const data = {
      name: orderName.current.value,
      ordered_products: products,
      total: total,
    };
    fetch(url, { method: 'POST', body: JSON.stringify(data) })
      .then((res) => res.json())
      .then((data) => {
        clearCart();
      });
  }

  function handleQuantity(id, direction) {
    const index = products.findIndex(
      (product) => product.item.id === parseInt(id)
    );
    let newArr = [...products];
    let value = handleIncrement(newArr[index].quantity, direction);
    newArr[index].quantity = value;
    setProducts(newArr);

    if (value === 0) handleRemove(id);
  }
  function handleIncrement(value, direction, amount = 1) {
    if (direction === 'up') {
      return (value += amount);
    }
    if (direction === 'down' && value >= 1) {
      return (value -= amount);
    }
    return value;
  }

  useEffect(() => {
    fetchAllProducts();
    fetchCouponCodes();
  }, []);

  useEffect(() => {
    // Must run this with products in dependency array since products are loaded asynchronously
    setTotalPrice();
  }, [products]);

  return (
    <CartView
      isLoading={isLoading}
      handlePlaceOrder={handlePlaceOrder}
      handleRemove={handleRemove}
      products={products}
      orderName={orderName}
      couponCode={couponCode}
      addCoupon={addCoupon}
      total={total}
      notDiscounted={notDiscounted}
      handleQuantity={handleQuantity}
    />
  );
}
