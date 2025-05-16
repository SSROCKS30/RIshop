
import PropTypes from 'prop-types';

const PageTransition = ({ children }) => {
  return <>{children}</>;
};

PageTransition.propTypes = {
  children: PropTypes.node.isRequired
};

export default PageTransition;