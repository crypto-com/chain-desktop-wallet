import React, { useEffect, useMemo, useState } from 'react';
import { Card, Select, Table, Tag, Tooltip } from 'antd';
import { SortOrder } from 'antd/lib/table/interface';
import { useTranslation } from 'react-i18next';
import { fetchProtocols, Protocol } from '../../../../service/defiLlama';
import IconTick from '../../../../svg/IconTick';
import { convertToInternationalCurrencySystem } from '../../../../utils/currency';
import { categories, projects, CronosProject, CategoryType } from '../../assets/projects';
import { PercentageLabel } from '../PercentageLabel';
import './style.less';

interface ICronosDappsTabProps {
  onClickDapp: (dapp: CronosProject) => void;
}

const CronosDAppsTab = (props: ICronosDappsTabProps) => {
  const { onClickDapp } = props;

  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>([]);

  const [fetchedProtocols, setFetchedProtocols] = useState<Protocol[]>([]);

  const [sortedProjects, setSortedProjects] = useState<CronosProject[]>(projects);

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

  useEffect(() => {
    sortedProjects.sort((a, b) => {
      const aTvl = protocolsMap.get(a.name.toLowerCase())?.tvl ?? 0;
      const bTvl = protocolsMap.get(b.name.toLowerCase())?.tvl ?? 0;

      return bTvl - aTvl;
    });

    setSortedProjects([...sortedProjects]);
  }, [protocolsMap]);

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
              src={`./dapp_logos/${project.logo}`}
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
      defaultSortOrder: 'descend' as SortOrder,
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
        const tvl = protocolsMap.get(project.name.toLowerCase())?.tvl ?? 0;
        if (tvl === 0) {
          return <span>-</span>;
        }

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
        const tvl = protocolsMap.get(project.name.toLowerCase())?.tvl ?? 0;
        if (tvl === 0) {
          return <span>-</span>;
        }
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
          return '-';
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
              <IconTick />
            </a>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Card style={{ margin: '30px 0' }}>
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
            ? sortedProjects
            : sortedProjects.filter(project => {
                return project.category.some(c => selectedCategories.includes(c));
              })
        }
        rowKey="id"
        rowClassName="dapps-table-row"
        pagination={false}
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
