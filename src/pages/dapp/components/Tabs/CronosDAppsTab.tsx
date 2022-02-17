import { Card, Select, Table, Tag, Tooltip } from 'antd';
import { SortOrder } from 'antd/lib/table/interface';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchProtocols, Protocol } from '../../../../service/defiLlama';
import { convertToInternationalCurrencySystem } from '../../../../utils/currency';
import { categories, projects, CronosProject, CategoryType } from '../../assets/projects';

const PercentageLabel = (props: { value: number | undefined }) => {
  const { value } = props;

  if (!value) {
    return <span>-</span>;
  }

  const color = value < 0 ? '#D9475A' : '#20BCA4';

  const signedText = value < 0 ? '-' : '+';

  return (
    <span style={{ color }}>
      {signedText}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
};

interface ICronosDappsTabProps {
  onClickDapp: (dapp: CronosProject) => void;
}

const CronosDAppsTab = (props: ICronosDappsTabProps) => {
  const { onClickDapp } = props;

  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>([]);

  const [fetchedProtocols, setFetchedProtocols] = useState<Protocol[]>([]);

  const [t] = useTranslation();

  useEffect(() => {
    fetchProtocols()
      .then(protocols => {
        setFetchedProtocols([...protocols]);
      })
      .catch();
  }, []);

  const protocolsMap = useMemo(() => {
    const map = new Map<string, Protocol>();
    fetchedProtocols.forEach(protocol => {
      map.set(protocol.name.toLowerCase(), protocol);
    });

    return map;
  }, [fetchedProtocols]);

  const categoriesNumbersMap = useMemo(() => {
    const map = new Map<CategoryType, number>();
    projects.forEach(p => {
      p.category.forEach(c => {
        const count = map.get(c) || 0;
        map.set(c, count + 1);
      });
    });
    return map;
  }, [projects]);

  const columns = [
    {
      title: t('dapp.cronosDApps.table.title.name'),
      key: 'name',
      render: (project: CronosProject, _, index) => {
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '10% 20% 70%',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                color: '#626973',
              }}
            >
              {index + 1}
            </span>
            <img
              style={{
                width: '24px',
                height: '24px',
                display: 'inline',
                borderRadius: '12px',
              }}
              src={`/dapp_logos/${project.logo}`}
              alt="project logo"
            />
            <span
              style={{
                color: '#1199FA',
              }}
            >
              {project.name}
            </span>
          </div>
        );
      },
    },
    {
      title: t('dapp.cronosDApps.table.title.tvl'),
      key: 'tvl',
      sortDirections: ['descend', 'ascend'] as SortOrder[],
      render: (project: CronosProject) => {
        const tvl = protocolsMap.get(project.name.toLowerCase())?.tvl ?? 0;

        if (tvl === 0) {
          return <span>-</span>;
        }

        return <Tooltip title={`$${tvl}`}>{convertToInternationalCurrencySystem(tvl)}</Tooltip>;
      },
      sorter: (a: CronosProject, b: CronosProject) => {
        const aTvl = protocolsMap.get(a.name.toLowerCase())?.tvl ?? 0;
        const bTvl = protocolsMap.get(b.name.toLowerCase())?.tvl ?? 0;

        return aTvl - bTvl;
      },
    },
    {
      title: t('dapp.cronosDApps.table.title.1d'),
      key: '1d_change',
      render: (project: CronosProject) => {
        const change = protocolsMap.get(project.name.toLowerCase())?.change_1d;

        return <PercentageLabel value={change} />;
      },
      sortDirections: ['descend', 'ascend'] as SortOrder[],
      sorter: (a: CronosProject, b: CronosProject) => {
        const aValue = protocolsMap.get(a.name.toLowerCase())?.change_1d;
        const bValue = protocolsMap.get(b.name.toLowerCase())?.change_1d;

        if (!aValue || !bValue) {
          return !aValue ? -1 : 1;
        }

        return aValue - bValue;
      },
    },
    {
      title: t('dapp.cronosDApps.table.title.7d'),
      key: '7d_change',
      render: (project: CronosProject) => {
        const change = protocolsMap.get(project.name.toLowerCase())?.change_7d;
        return <PercentageLabel value={change} />;
      },
      sortDirections: ['descend', 'ascend'] as SortOrder[],
      sorter: (a: CronosProject, b: CronosProject) => {
        const aValue = protocolsMap.get(a.name.toLowerCase())?.change_7d;
        const bValue = protocolsMap.get(b.name.toLowerCase())?.change_7d;

        if (!aValue || !bValue) {
          return !aValue ? -1 : 1;
        }

        return aValue - bValue;
      },
    },

    {
      title: t('dapp.cronosDApps.table.title.category'),
      key: 'category',
      render: (project: CronosProject) => (
        <div>
          {project.category.map(c => (
            <Tag color="blue" key={c} style={{ borderRadius: '4px', color: '#1199FA' }}>
              {c}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: (
        <Tooltip title={t('dapp.cronosDApps.table.title.audit.tooltip')}>
          {t('dapp.cronosDApps.table.title.audit')}
        </Tooltip>
      ),
      key: 'audit',
      render: (project: CronosProject) => {
        const links = protocolsMap.get(project.name.toLowerCase())?.audit_links;

        if (!links || links?.length < 1) {
          return t('dapp.cronosDApps.table.title.audit.no');
        }

        const link = links[0];

        return (
          <Tooltip title={link}>
            <a
              target="__blank"
              href={link}
              onClick={e => {
                e.stopPropagation();
              }}
            >
              {t('dapp.cronosDApps.table.title.audit.yes')}
            </a>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Card>
      <Select
        mode="multiple"
        showSearch={false}
        style={{ minWidth: '180px' }}
        showArrow
        placeholder={t('dapp.cronosDApps.table.title.category.select')}
        onChange={e => {
          setSelectedCategories([...e]);
        }}
        value={selectedCategories}
        tagRender={prop => {
          const { label, closable, onClose } = prop;
          const onPreventMouseDown = event => {
            event.preventDefault();
            event.stopPropagation();
          };
          return (
            <Tag
              color="blue"
              onMouseDown={onPreventMouseDown}
              closable={closable}
              onClose={onClose}
              style={{ marginRight: 3, borderRadius: '4px', color: '#1199FA' }}
            >
              {label}
            </Tag>
          );
        }}
        options={categories.map(c => {
          return {
            label: `${c} (${categoriesNumbersMap.get(c)})`,
            key: c,
            value: c,
          };
        })}
      />
      <Table
        dataSource={
          selectedCategories.length === 0
            ? projects
            : projects.filter(project => {
                return project.category.some(c => selectedCategories.includes(c));
              })
        }
        rowKey="id"
        columns={columns}
        onRow={(record: CronosProject) => {
          return {
            onClick: () => {
              onClickDapp(record);
            },
          };
        }}
      />
    </Card>
  );
};

export default CronosDAppsTab;
